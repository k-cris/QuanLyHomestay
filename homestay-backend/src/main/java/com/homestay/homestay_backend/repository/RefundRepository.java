package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRepository extends JpaRepository<Refund, Long> {
    
    @Query("SELECT r FROM Refund r WHERE r.user.id = :userId ORDER BY r.requestedAt DESC")
    List<Refund> findMyRefunds(@Param("userId") Long userId);
    
    @Query("SELECT r FROM Refund r WHERE r.booking.homestay.host.id = :hostId ORDER BY r.requestedAt DESC")
    List<Refund> findHostRefunds(@Param("hostId") Long hostId);
    
    Optional<Refund> findByBookingId(Long bookingId);
}
