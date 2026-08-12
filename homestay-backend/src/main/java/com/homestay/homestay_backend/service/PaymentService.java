package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.dto.PaymentResponseDto;
import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public PaymentResponseDto processPayment(Long bookingId, Long payerId, String paymentMethod) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getGuest() == null || !booking.getGuest().getId().equals(payerId)) {
            throw new RuntimeException("Bạn chỉ có thể thanh toán đơn của chính mình");
        }
        if (booking.getStatus() != BookingStatusEnum.PENDING) {
            throw new RuntimeException("Chỉ có thể thanh toán cho đơn hàng PENDING");
        }
        if (paymentRepository.findByBookingId(bookingId).isPresent()) {
            throw new RuntimeException("Đơn này đã được thanh toán");
        }

        User guest = booking.getGuest();
        User host = booking.getHomestay() != null ? booking.getHomestay().getHost() : null;

        requireBankAccount(guest, "Bạn cần cập nhật tài khoản ngân hàng để hệ thống hoàn tiền khi đơn không hoàn thành");
        requireBankAccount(host, "Chủ Homestay chưa cập nhật tài khoản nhận tiền. Vui lòng chọn Homestay khác hoặc liên hệ chủ nhà");

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setPaymentMethod(paymentMethod != null && !paymentMethod.isBlank() ? paymentMethod : "BANK_TRANSFER");
        payment.setTransactionCode("TXN-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setAmount(booking.getTotalPrice());
        payment.setStatus(PaymentStatusEnum.PAID);
        payment.setPaidAt(java.time.LocalDateTime.now());
        payment.setReceiverBankName(host.getBankName());
        payment.setReceiverBankHolder(host.getBankHolder());
        payment.setReceiverBankAccount(host.getBankAccount());

        return PaymentResponseDto.from(paymentRepository.save(payment));
    }

    /**
     * BR-6 Auto Refund:
     * chỉ hoàn khi payment = PAID và booking vừa chuyển REJECTED/CANCELLED;
     * hoàn về bankAccount của guest; sau đó payment = REFUNDED.
     */
    @Transactional
    public Payment triggerAutoRefund(Booking booking) {
        if (booking == null || booking.getId() == null) {
            return null;
        }

        BookingStatusEnum status = booking.getStatus();
        if (status != BookingStatusEnum.REJECTED && status != BookingStatusEnum.CANCELLED) {
            return null;
        }

        Payment payment = booking.getPayment();
        if (payment == null) {
            payment = paymentRepository.findByBookingId(booking.getId()).orElse(null);
        }
        if (payment == null || payment.getStatus() != PaymentStatusEnum.PAID) {
            return payment;
        }

        User guest = booking.getGuest();
        String bankAccount = guest != null ? guest.getBankAccount() : null;
        String bankHolder = guest != null ? guest.getBankHolder() : null;
        String bankName = guest != null ? guest.getBankName() : null;

        if (bankAccount == null || bankAccount.isBlank()) {
            throw new RuntimeException("Không thể hoàn tiền: khách chưa cập nhật số tài khoản ngân hàng");
        }

        payment.setStatus(PaymentStatusEnum.REFUNDED);
        payment.setRefundedAt(java.time.LocalDateTime.now());
        payment.setRefundBankAccount(bankAccount);
        payment.setRefundNote(String.format(
                "Auto refund do booking %s. Nhận: %s - %s (%s)",
                status.name(),
                bankHolder != null ? bankHolder : "N/A",
                bankAccount,
                bankName != null ? bankName : "N/A"
        ));

        return paymentRepository.save(payment);
    }

    private void requireBankAccount(User user, String message) {
        if (user == null
                || user.getBankAccount() == null || user.getBankAccount().isBlank()
                || user.getBankName() == null || user.getBankName().isBlank()
                || user.getBankHolder() == null || user.getBankHolder().isBlank()) {
            throw new RuntimeException(message);
        }
    }
}
