
const fs = require('fs');
const path = require('path');

const baseDir = 'd:\\Bao_cao_nien_luan(new)\\homestay-backend\\src\\main\\java\\com\\homestay\\homestay_backend';

const authController = `package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.RoleEnum;
import com.homestay.homestay_backend.repository.UserRepository;
import com.homestay.homestay_backend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("Email đã tồn tại");
        }
        user.setRole(RoleEnum.USER);
        userRepository.save(user);
        return ResponseEntity.ok("Đăng ký thành công");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");
        
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body("Sai email hoặc mật khẩu");
        }
        
        String token = jwtUtil.generateToken(user.getEmail(), "ROLE_" + user.getRole().name());
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);
        
        return ResponseEntity.ok(response);
    }
}
`;

const bookingController = `package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.service.BookingService;
import com.homestay.homestay_backend.entity.Booking;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking, @RequestParam Long guestId, @RequestParam Long homestayId) {
        try {
            bookingService.createBooking(guestId, homestayId, booking.getCheckinDate(), booking.getCheckoutDate(), booking.getTotalGuests(), booking.getNote());
            return ResponseEntity.ok("Booking created");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllBookings() {
        return ResponseEntity.ok().build(); // TODO: impl
    }
}
`;

const homestayController = `package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.service.HomestayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/homestays")
public class HomestayController {
    @Autowired
    private HomestayService homestayService;

    @GetMapping
    public ResponseEntity<?> getAllHomestays() {
        return ResponseEntity.ok(homestayService.getAllHomestays());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHomestay(@PathVariable Long id, @RequestParam Long hostId) {
        try {
            homestayService.deleteHomestay(hostId, id);
            return ResponseEntity.ok("Homestay deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
`;

const dashboardService = `package com.homestay.homestay_backend.service;

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
`;

const dashboardController = `package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminStats());
    }
}
`;

fs.writeFileSync(path.join(baseDir, 'controller', 'AuthController.java'), authController);
fs.writeFileSync(path.join(baseDir, 'controller', 'BookingController.java'), bookingController);
fs.writeFileSync(path.join(baseDir, 'controller', 'HomestayController.java'), homestayController);
fs.writeFileSync(path.join(baseDir, 'controller', 'DashboardController.java'), dashboardController);
fs.writeFileSync(path.join(baseDir, 'service', 'DashboardService.java'), dashboardService);

console.log("Controllers fixed");
