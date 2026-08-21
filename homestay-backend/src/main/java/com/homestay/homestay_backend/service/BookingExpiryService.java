package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.config.HomestaySchedulerProperties;
import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * UC-06 / BR-9: SYSTEM quét đơn PENDING quá hạn thanh toán hoặc quá hạn Host duyệt.
 */
@Service
@RequiredArgsConstructor
public class BookingExpiryService {

    private final BookingRepository bookingRepository;
    private final BookingExpiryProcessor bookingExpiryProcessor;
    private final HomestaySchedulerProperties schedulerProperties;

    /**
     * Quét và xử lý toàn bộ đơn PENDING quá hạn.
     *
     * @return số đơn đã chuyển sang CANCELLED
     */
    public int processExpiredPendingBookings() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime paymentDeadline = now.minusHours(schedulerProperties.getPaymentDeadlineHours());
        LocalDateTime hostApprovalDeadline = now.minusHours(schedulerProperties.getHostApprovalDeadlineHours());

        List<Booking> unpaidOverdue = bookingRepository.findPendingUnpaidOlderThan(paymentDeadline);
        List<Booking> paidAwaitingHost = bookingRepository.findPendingPaidAwaitingHostOlderThan(hostApprovalDeadline);

        List<Booking> checkinPassed = bookingRepository.findPendingCheckinPassed(now.toLocalDate());

        int cancelled = 0;
        for (Booking booking : checkinPassed) {
            if (bookingExpiryProcessor.cancelCheckinPassed(booking.getId())) {
                cancelled++;
            }
        }
        for (Booking booking : unpaidOverdue) {
            if (bookingExpiryProcessor.cancelUnpaidOverdue(booking.getId())) {
                cancelled++;
            }
        }
        for (Booking booking : paidAwaitingHost) {
            if (bookingExpiryProcessor.cancelHostApprovalOverdue(booking.getId())) {
                cancelled++;
            }
        }
        return cancelled;
    }
}
