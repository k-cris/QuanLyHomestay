package com.homestay.homestay_backend.scheduler;

import com.homestay.homestay_backend.config.HomestaySchedulerProperties;
import com.homestay.homestay_backend.service.BookingExpiryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * UC-06 / BR-9: cron job SYSTEM quét đơn PENDING quá hạn.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingExpiryScheduler {

    private final BookingExpiryService bookingExpiryService;
    private final HomestaySchedulerProperties schedulerProperties;

    @Scheduled(cron = "${homestay.scheduler.cron:0 */5 * * * *}")
    public void cancelExpiredPendingBookings() {
        if (!schedulerProperties.isEnabled()) {
            return;
        }
        try {
            int count = bookingExpiryService.processExpiredPendingBookings();
            if (count > 0) {
                log.info("[SYSTEM] Booking expiry job: đã hủy {} đơn PENDING quá hạn", count);
            }
        } catch (Exception e) {
            log.error("[SYSTEM] Booking expiry job failed", e);
        }
    }
}
