package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.HomestayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {
    @Autowired
    private HomestayRepository homestayRepository;
    @Autowired
    private BookingRepository bookingRepository;

    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalHomestays", homestayRepository.count());
        stats.put("totalBookings", bookingRepository.count());
        return stats;
    }
}
