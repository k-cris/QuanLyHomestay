package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Review;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final HomestayService homestayService;

    // Business Rule 8: Chỉ tạo review khi Booking COMPLETED; chỉ review 1 lần
    @Transactional
    public Review createReview(Long guestId, Long bookingId, Integer rating, String comment) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        
        if (!booking.getGuest().getId().equals(guestId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (booking.getStatus() != BookingStatusEnum.COMPLETED) {
            throw new RuntimeException("Can only review COMPLETED bookings");
        }
        if (reviewRepository.existsByBookingId(bookingId)) {
            throw new RuntimeException("Review already exists for this booking");
        }

        Review review = Review.builder()
                .booking(booking)
                .guest(booking.getGuest())
                .homestay(booking.getHomestay())
                .rating(rating)
                .comment(comment)
                .build();
        reviewRepository.save(review);

        // Update Average Rating cho Homestay
        List<Review> allReviews = reviewRepository.findByHomestayId(booking.getHomestay().getId());
        double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        homestayService.updateAverageRating(booking.getHomestay().getId(), avg);

        return review;
    }

    public List<Review> getReviewsByHomestay(Long homestayId) {
        return reviewRepository.findByHomestayId(homestayId);
    }
}
