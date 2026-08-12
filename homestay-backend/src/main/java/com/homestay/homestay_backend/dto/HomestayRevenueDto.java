package com.homestay.homestay_backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HomestayRevenueDto {
    private Long homestayId;
    private String homestayTitle;
    private String city;
    private Long hostId;
    private String hostFullName;
    private String hostEmail;
    private double revenue;
    private long bookingCount;
}
