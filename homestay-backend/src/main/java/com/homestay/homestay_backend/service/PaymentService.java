package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.dto.PaymentResponseDto;
import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.entity.Refund;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.PaymentRepository;
import com.homestay.homestay_backend.repository.RefundRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final RefundRepository refundRepository;

    /**
     * Thanh toán booking.
     *
     * Quy trình:
     * Booking PENDING
     *       ↓
     * Payment PAID
     */
    @Transactional
    public PaymentResponseDto processPayment(
            Long bookingId,
            Long payerId,
            String paymentMethod) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException("Booking not found"));

        // Chỉ Guest của booking mới được thanh toán
        if (booking.getGuest() == null
                || !booking.getGuest().getId().equals(payerId)) {

            throw new RuntimeException(
                    "Bạn chỉ có thể thanh toán đơn của chính mình");
        }

        // Chỉ được thanh toán booking PENDING
        if (booking.getStatus() != BookingStatusEnum.PENDING) {
            throw new RuntimeException(
                    "Chỉ có thể thanh toán cho đơn hàng PENDING");
        }

        // Không cho thanh toán lần 2
        if (paymentRepository.findByBookingId(bookingId).isPresent()) {
            throw new RuntimeException(
                    "Đơn này đã được thanh toán");
        }

        User guest = booking.getGuest();

        User host = booking.getHomestay() != null
                ? booking.getHomestay().getHost()
                : null;

        // Guest phải có tài khoản ngân hàng
        requireBankAccount(
                guest,
                "Bạn cần cập nhật tài khoản ngân hàng để hệ thống hoàn tiền khi đơn không hoàn thành");

        // Host phải có tài khoản ngân hàng
        requireBankAccount(
                host,
                "Chủ Homestay chưa cập nhật tài khoản nhận tiền. Vui lòng chọn Homestay khác hoặc liên hệ chủ nhà");

        Payment payment = new Payment();

        payment.setBooking(booking);

        payment.setPaymentMethod(
                paymentMethod != null && !paymentMethod.isBlank()
                        ? paymentMethod
                        : "BANK_TRANSFER"
        );

        payment.setTransactionCode(
                "TXN-"
                        + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase()
        );

        payment.setAmount(booking.getTotalPrice());

        // Thanh toán thành công
        payment.setStatus(PaymentStatusEnum.PAID);

        payment.setPaidAt(LocalDateTime.now());

        // Snapshot tài khoản Host tại thời điểm thanh toán
        payment.setReceiverBankName(host.getBankName());
        payment.setReceiverBankHolder(host.getBankHolder());
        payment.setReceiverBankAccount(host.getBankAccount());

        return PaymentResponseDto.from(
                paymentRepository.save(payment)
        );
    }

    /**
     * ============================================================
     * TẠO YÊU CẦU HOÀN TIỀN
     * ============================================================
     *
     * Lưu ý:
     *
     * Hàm này KHÔNG chuyển tiền.
     *
     * Hàm này chỉ:
     *
     * 1. Kiểm tra booking đã bị REJECTED/CANCELLED
     * 2. Kiểm tra Payment = PAID
     * 3. Tính số tiền cần hoàn
     * 4. Tạo Refund = PENDING
     *
     * Payment vẫn giữ PAID.
     *
     * Sau đó:
     *
     * Host chuyển tiền
     *      ↓
     * Refund = SENT
     *
     * Guest xác nhận
     *      ↓
     * Refund = CONFIRMED
     *
     * Khi đó Payment mới chuyển REFUNDED.
     */
    @Transactional
    public Payment createRefundRequest(
            Booking booking,
            int refundPercent) {

        if (booking == null || booking.getId() == null) {
            return null;
        }

        BookingStatusEnum status = booking.getStatus();

        // Chỉ được tạo Refund khi booking REJECTED hoặc CANCELLED
        if (status != BookingStatusEnum.REJECTED
                && status != BookingStatusEnum.CANCELLED) {

            return null;
        }

        // Lấy Payment
        Payment payment = booking.getPayment();

        if (payment == null) {
            payment = paymentRepository
                    .findByBookingId(booking.getId())
                    .orElse(null);

            if (payment != null) {
                booking.setPayment(payment);
            }
        }

        // Chưa thanh toán thì không có Refund
        if (payment == null) {
            return null;
        }

        if (payment.getStatus() != PaymentStatusEnum.PAID) {
            return payment;
        }

        // Giới hạn phần trăm hoàn tiền từ 0 → 100
        int percent = Math.min(
                100,
                Math.max(0, refundPercent)
        );

        double original =
                payment.getAmount() != null
                        ? payment.getAmount()
                        : 0.0;

        // Tính tiền hoàn
        double refundAmount =
                Math.round(original * percent) / 100.0;

        // Không cho tiền hoàn âm
        if (refundAmount < 0) {
            refundAmount = 0;
        }

        // Không cho tiền hoàn vượt quá tiền thanh toán
        if (refundAmount > original) {
            refundAmount = original;
        }

        User guest = booking.getGuest();

        if (guest == null) {
            throw new RuntimeException(
                    "Không thể tạo yêu cầu hoàn tiền: booking không có khách");
        }

        String bankAccount = guest.getBankAccount();
        String bankHolder = guest.getBankHolder();
        String bankName = guest.getBankName();

        // Guest phải có thông tin nhận tiền
        if (bankAccount == null || bankAccount.isBlank()) {
            throw new RuntimeException(
                    "Không thể hoàn tiền: khách chưa cập nhật số tài khoản ngân hàng");
        }

        if (bankHolder == null || bankHolder.isBlank()) {
            throw new RuntimeException(
                    "Không thể hoàn tiền: khách chưa cập nhật tên chủ tài khoản");
        }

        if (bankName == null || bankName.isBlank()) {
            throw new RuntimeException(
                    "Không thể hoàn tiền: khách chưa cập nhật tên ngân hàng");
        }

        /*
         * ========================================================
         * QUAN TRỌNG:
         *
         * KHÔNG:
         *
         * payment.setStatus(REFUNDED);
         *
         * vì Host chưa chuyển tiền.
         *
         * Payment vẫn phải là PAID.
         * ========================================================
         */

        payment.setRefundBankAccount(bankAccount);
        payment.setRefundPercent(percent);
        payment.setRefundAmount(refundAmount);

        payment.setRefundNote(
                String.format(
                        "Yêu cầu hoàn %d%% (%.0f ₫) do booking %s. " +
                        "Nhận: %s - %s (%s)",
                        percent,
                        refundAmount,
                        status.name(),
                        bankHolder,
                        bankAccount,
                        bankName
                )
        );

        Payment savedPayment =
                paymentRepository.save(payment);

        /*
         * ========================================================
         * CHỈ TẠO REFUND NẾU CHƯA CÓ
         * ========================================================
         */

        if (refundRepository
                .findByBookingId(booking.getId())
                .isEmpty()) {

            Refund refund = Refund.builder()
                    .booking(booking)
                    .user(guest)

                    .amount(
                            BigDecimal.valueOf(refundAmount)
                    )

                    .receiverBankName(bankName)
                    .receiverBankAccount(bankAccount)
                    .receiverBankHolder(bankHolder)

                    // REJECTED hoặc CANCELLED
                    .reason(status.name())

                    // Chờ Host chuyển tiền
                    .status("PENDING")

                    .build();

            refundRepository.save(refund);
        }

        return savedPayment;
    }

    /**
     * Hàm tương thích với code cũ.
     *
     * Host reject → hoàn 100%.
     *
     * Tuy nhiên đây KHÔNG còn là "Auto Refund".
     * Nó chỉ tạo yêu cầu Refund PENDING.
     */
    @Transactional
    public Payment triggerAutoRefund(Booking booking) {
        return createRefundRequest(booking, 100);
    }

    /**
     * Hàm tương thích với code cũ.
     *
     * Có thể giữ lại để BookingService hiện tại
     * không cần sửa ngay.
     *
     * Thực tế:
     *
     * triggerAutoRefund()
     *       ↓
     * createRefundRequest()
     *       ↓
     * Refund = PENDING
     */
    @Transactional
    public Payment triggerAutoRefund(
            Booking booking,
            int refundPercent) {

        return createRefundRequest(
                booking,
                refundPercent
        );
    }

    /**
     * Kiểm tra tài khoản ngân hàng.
     */
    private void requireBankAccount(
            User user,
            String message) {

        if (user == null
                || user.getBankAccount() == null
                || user.getBankAccount().isBlank()
                || user.getBankName() == null
                || user.getBankName().isBlank()
                || user.getBankHolder() == null
                || user.getBankHolder().isBlank()) {

            throw new RuntimeException(message);
        }
    }
}