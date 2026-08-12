package com.homestay.homestay_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class RevenueStatsResponse {
    /** month | year */
    private String mode;
    private int year;
    /** null khi xem cả năm */
    private Integer month;
    private double totalRevenue;
    private long totalBookings;
    private long totalHomestays;

    @Builder.Default
    private List<HomestayRevenueDto> homestays = new ArrayList<>();

    /** Chuỗi 12 tháng khi mode=year; rỗng khi mode=month */
    @Builder.Default
    private List<MonthlyRevenuePointDto> monthlySeries = new ArrayList<>();

    @Builder.Default
    private List<Integer> availableYears = new ArrayList<>();
}
