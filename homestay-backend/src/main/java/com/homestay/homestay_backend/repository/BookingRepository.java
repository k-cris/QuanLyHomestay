package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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
}
