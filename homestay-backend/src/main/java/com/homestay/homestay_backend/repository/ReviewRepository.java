package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByHomestayId(Long homestayId);
    boolean existsByBookingId(Long bookingId);
}
