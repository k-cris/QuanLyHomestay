package com.homestay.homestay_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DashboardStats {
	private long totalHomestays;
	private long totalBookings;
	private double totalRevenue;
	private long pendingBookings;
	
}
