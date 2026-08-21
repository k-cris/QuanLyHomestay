package com.homestay.homestay_backend.dto;

import com.homestay.homestay_backend.entity.Review;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewResponseDto {
    private Long id;
    private Long bookingId;
    private Long guestId;
    private String guestName;
    private Integer rating;
    private String comment;

    public static ReviewResponseDto from(Review review) {
        return ReviewResponseDto.builder()
                .id(review.getId())
                .bookingId(review.getBooking().getId())
                .guestId(review.getGuest().getId())
                .guestName(review.getGuest().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .build();
    }
}
