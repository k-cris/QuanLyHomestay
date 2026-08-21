package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.config.HomestaySchedulerProperties;
import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Xử lý từng đơn quá hạn trong transaction riêng (tránh rollback cả batch).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingExpiryProcessor {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final HomestaySchedulerProperties schedulerProperties;

    /** BR-9: quá hạn thanh toán → CANCELLED (không PAID → không hoàn tiền). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean cancelUnpaidOverdue(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null || booking.getStatus() != BookingStatusEnum.PENDING) {
            return false;
        }
        ensurePaymentLoaded(booking);
        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatusEnum.PAID) {
            return false;
        }
        LocalDateTime deadline = LocalDateTime.now().minusHours(schedulerProperties.getPaymentDeadlineHours());
        if (booking.getCreatedAt() == null || !booking.getCreatedAt().isBefore(deadline)) {
            return false;
        }

        booking.setStatus(BookingStatusEnum.CANCELLED);
        bookingRepository.save(booking);
        log.info("[SYSTEM] Auto-cancel booking {} — quá hạn thanh toán ({} giờ)",
                booking.getBookingCode(), schedulerProperties.getPaymentDeadlineHours());
        return true;
    }

    /** BR-9 + BR-6: quá hạn Host duyệt (đã PAID) → CANCELLED + Auto Refund 100%. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean cancelHostApprovalOverdue(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null || booking.getStatus() != BookingStatusEnum.PENDING) {
            return false;
        }
        ensurePaymentLoaded(booking);
        if (booking.getPayment() == null || booking.getPayment().getStatus() != PaymentStatusEnum.PAID) {
            return false;
        }
        LocalDateTime paidAt = booking.getPayment().getPaidAt();
        LocalDateTime deadline = LocalDateTime.now().minusHours(schedulerProperties.getHostApprovalDeadlineHours());
        if (paidAt == null || !paidAt.isBefore(deadline)) {
            return false;
        }
        if (booking.getGuest() != null) {
            booking.getGuest().getBankAccount();
        }

        booking.setStatus(BookingStatusEnum.CANCELLED);
        bookingRepository.save(booking);

        try {
            paymentService.triggerAutoRefund(booking, 100);
            log.info("[SYSTEM] Auto-cancel + refund 100% booking {} — quá hạn Host duyệt ({} giờ)",
                    booking.getBookingCode(), schedulerProperties.getHostApprovalDeadlineHours());
        } catch (Exception e) {
            log.warn("[SYSTEM] Auto-cancel booking {} nhưng hoàn tiền thất bại: {}",
                    booking.getBookingCode(), e.getMessage());
        }
        return true;
    }

    private void ensurePaymentLoaded(Booking booking) {
        if (booking.getPayment() == null && booking.getId() != null) {
            paymentRepository.findByBookingId(booking.getId()).ifPresent(booking::setPayment);
        }
    }

    /** Quá ngày check-in mà vẫn PENDING → CANCELLED (Hoàn tiền nếu đã thanh toán). */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean cancelCheckinPassed(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null || booking.getStatus() != BookingStatusEnum.PENDING) {
            return false;
        }
        ensurePaymentLoaded(booking);

        java.time.LocalDate today = java.time.LocalDate.now();
        if (booking.getCheckinDate() == null || !booking.getCheckinDate().isBefore(today)) {
            return false;
        }

        booking.setStatus(BookingStatusEnum.CANCELLED);
        bookingRepository.save(booking);

        if (booking.getPayment() != null && booking.getPayment().getStatus() == PaymentStatusEnum.PAID) {
            try {
                paymentService.triggerAutoRefund(booking, 100);
                log.info("[SYSTEM] Auto-cancel + refund 100% booking {} — quá ngày check-in", booking.getBookingCode());
            } catch (Exception e) {
                log.warn("[SYSTEM] Auto-cancel booking {} nhưng hoàn tiền thất bại: {}", booking.getBookingCode(), e.getMessage());
            }
        } else {
            log.info("[SYSTEM] Auto-cancel booking {} — quá ngày check-in (chưa thanh toán)", booking.getBookingCode());
        }
        return true;
    }
}
