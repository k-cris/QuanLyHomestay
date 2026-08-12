package com.homestay.homestay_backend.controller;

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

    @Autowired
    private com.homestay.homestay_backend.repository.UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody java.util.Map<String, Object> payload, org.springframework.security.core.Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body("Chưa đăng nhập");
            }
            com.homestay.homestay_backend.entity.User user = userRepository.findByEmail(authentication.getName())
                        .orElseThrow(() -> new RuntimeException("User not found"));
            
            Long homestayId = Long.valueOf(payload.get("homestayId").toString());
            java.time.LocalDate checkinDate = java.time.LocalDate.parse(payload.get("checkinDate").toString());
            java.time.LocalDate checkoutDate = java.time.LocalDate.parse(payload.get("checkoutDate").toString());
            Integer guests = Integer.valueOf(payload.get("totalGuests").toString());
            String note = payload.containsKey("note") ? payload.get("note").toString() : null;

            Booking newBooking = bookingService.createBooking(user.getId(), homestayId, 
                    checkinDate, checkoutDate, guests, note);
            
            return ResponseEntity.ok(newBooking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyBookings(org.springframework.security.core.Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body("Chưa đăng nhập");
            }
            com.homestay.homestay_backend.entity.User user = userRepository.findByEmail(authentication.getName())
                        .orElseThrow(() -> new RuntimeException("User not found"));
            
            java.util.List<Booking> bookings = bookingService.getBookingRepository().findByGuestId(user.getId());
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
