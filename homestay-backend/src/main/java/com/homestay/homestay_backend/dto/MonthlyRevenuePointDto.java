package com.homestay.homestay_backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MonthlyRevenuePointDto {
    private int month;
    private String label;
    private double revenue;
    private long bookingCount;
}
