package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import com.homestay.homestay_backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.homestay.homestay_backend.repository.BookingRepository bookingRepository;

    @Transactional
    public Payment processPayment(Long bookingId, String paymentMethod) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getStatus() != BookingStatusEnum.PENDING) {
            throw new RuntimeException("Chỉ có thể thanh toán cho đơn hàng PENDING");
        }
        
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setPaymentMethod(paymentMethod);
        payment.setTransactionCode("TXN-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setAmount(booking.getTotalPrice());
        payment.setStatus(PaymentStatusEnum.PAID);
        payment.setPaidAt(java.time.LocalDateTime.now());
        
        return paymentRepository.save(payment);
    }

    // Business Rule 6: Auto Refund (SYSTEM)
    @Transactional
    public void triggerAutoRefund(Booking booking) {
        Payment payment = booking.getPayment();
        if (payment != null && payment.getStatus() == PaymentStatusEnum.PAID) {
            if (booking.getStatus() == BookingStatusEnum.REJECTED || booking.getStatus() == BookingStatusEnum.CANCELLED) {
                // Call external Bank API to refund to booking.getGuest().getBankAccount()
                // ...
                payment.setStatus(PaymentStatusEnum.REFUNDED);
                paymentRepository.save(payment);
            }
        }
    }
}
