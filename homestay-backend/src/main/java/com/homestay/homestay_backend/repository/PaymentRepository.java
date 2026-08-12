package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByBookingId(Long bookingId);

    @Query("SELECT p FROM Payment p " +
            "JOIN FETCH p.booking b " +
            "JOIN FETCH b.homestay h " +
            "JOIN FETCH h.host " +
            "WHERE p.status = :status")
    List<Payment> findAllByStatusWithDetails(PaymentStatusEnum status);
}
