package com.homestay.homestay_backend.dto;

import lombok.Data;

@Data
public class ReviewCreateDto {
    private Long bookingId;
    private Integer rating;
    private String comment;
}
