package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByGuestId(Long guestId);

    List<Booking> findByHomestayHostId(Long hostId);

    List<Booking> findByStatus(BookingStatusEnum status);

    // User Request: Đơn PENDING chưa confirm thì không báo trùng ngày
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.homestay.id = :homestayId " +
            "AND b.status IN ('CONFIRM', 'COMPLETED') " +
            "AND b.checkinDate < :checkoutDate AND b.checkoutDate > :checkinDate")
    long countOverlappingBookings(@Param("homestayId") Long homestayId,
            @Param("checkinDate") LocalDate checkinDate,
            @Param("checkoutDate") LocalDate checkoutDate);

    // Business Rule 4: Check active bookings trước khi xoá Homestay
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.homestay.id = :homestayId AND b.status IN ('PENDING', 'CONFIRM')")
    long countActiveBookings(@Param("homestayId") Long homestayId);

    /** BR-9: PENDING chưa thanh toán (không có payment PAID) quá hạn tạo đơn. */
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.guest LEFT JOIN FETCH b.payment p " +
            "WHERE b.status = 'PENDING' AND b.createdAt IS NOT NULL AND b.createdAt < :deadline " +
            "AND (p IS NULL OR p.status <> 'PAID')")
    List<Booking> findPendingUnpaidOlderThan(@Param("deadline") LocalDateTime deadline);

    /** BR-9: PENDING đã PAID, Host chưa duyệt quá hạn kể từ paidAt. */
    @Query("SELECT b FROM Booking b JOIN b.payment p JOIN FETCH b.guest " +
            "WHERE b.status = 'PENDING' AND p.status = 'PAID' AND p.paidAt IS NOT NULL AND p.paidAt < :deadline")
    List<Booking> findPendingPaidAwaitingHostOlderThan(@Param("deadline") LocalDateTime deadline);

    @Query("SELECT b FROM Booking b WHERE b.homestay.id = :homestayId AND b.status IN ('CONFIRM', 'COMPLETED') " +
           "AND b.checkinDate <= :endDate AND b.checkoutDate > :startDate")
    List<Booking> findOccupyingBookings(@Param("homestayId") Long homestayId, 
                                        @Param("startDate") LocalDate startDate, 
                                        @Param("endDate") LocalDate endDate);

    @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' AND b.checkinDate < :today")
    List<Booking> findPendingCheckinPassed(@Param("today") LocalDate today);
}
