package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.dto.ReviewCreateDto;
import com.homestay.homestay_backend.dto.ReviewResponseDto;
import com.homestay.homestay_backend.entity.Review;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<?> createReview(
            @AuthenticationPrincipal User user,
            @RequestBody ReviewCreateDto dto) {
        try {
            Review review = reviewService.createReview(
                    user.getId(),
                    dto.getBookingId(),
                    dto.getRating(),
                    dto.getComment()
            );
            return ResponseEntity.ok(ReviewResponseDto.from(review));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/homestay/{homestayId}")
    public ResponseEntity<List<ReviewResponseDto>> getHomestayReviews(@PathVariable Long homestayId) {
        List<ReviewResponseDto> reviews = reviewService.getReviewsByHomestay(homestayId)
                .stream()
                .map(ReviewResponseDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reviews);
    }
}
