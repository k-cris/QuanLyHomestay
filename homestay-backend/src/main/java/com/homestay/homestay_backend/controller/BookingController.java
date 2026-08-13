package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.dto.BookingResponseDto;
import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.enums.RoleEnum;
import com.homestay.homestay_backend.repository.UserRepository;
import com.homestay.homestay_backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody java.util.Map<String, Object> payload, Authentication authentication) {
        try {
            User user = requireUser(authentication);

            Long homestayId = Long.valueOf(payload.get("homestayId").toString());
            java.time.LocalDate checkinDate = java.time.LocalDate.parse(payload.get("checkinDate").toString());
            java.time.LocalDate checkoutDate = java.time.LocalDate.parse(payload.get("checkoutDate").toString());
            Integer guests = Integer.valueOf(payload.get("totalGuests").toString());
            String note = payload.containsKey("note") && payload.get("note") != null
                    ? payload.get("note").toString()
                    : null;

            Booking newBooking = bookingService.createBooking(
                    user.getId(), homestayId, checkinDate, checkoutDate, guests, note
            );
            return ResponseEntity.ok(BookingResponseDto.from(newBooking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyBookings(Authentication authentication) {
        try {
            User user = requireUser(authentication);
            return ResponseEntity.ok(bookingService.getBookingsOfGuest(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC-06: Host xem đơn thuộc Homestay mình */
    @GetMapping("/host")
    public ResponseEntity<?> getHostBookings(
            Authentication authentication,
            @RequestParam(required = false) BookingStatusEnum status
    ) {
        try {
            User user = requireHost(authentication);
            return ResponseEntity.ok(bookingService.getBookingsOfHost(user.getId(), status));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    /** UC-06 + BR-5: Host duyệt đơn */
    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(Authentication authentication, @PathVariable Long id) {
        try {
            User user = requireHost(authentication);
            BookingResponseDto dto = bookingService.confirmBooking(user.getId(), id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC-06 + BR-5/6: Host từ chối → Auto Refund nếu đã PAID */
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(Authentication authentication, @PathVariable Long id) {
        try {
            User user = requireHost(authentication);
            BookingResponseDto dto = bookingService.rejectBooking(user.getId(), id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC-08: xem chính sách hoàn tiền trước khi hủy */
    @GetMapping("/{id}/cancel-preview")
    public ResponseEntity<?> cancelPreview(Authentication authentication, @PathVariable Long id) {
        try {
            User user = requireUser(authentication);
            return ResponseEntity.ok(bookingService.getCancelPreview(user.getId(), id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC-08 + BR-7: khách hủy đơn → Auto Refund theo % nếu đã PAID */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(Authentication authentication, @PathVariable Long id) {
        try {
            User user = requireUser(authentication);
            BookingResponseDto dto = bookingService.cancelBooking(user.getId(), id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private User requireUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Chưa đăng nhập");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private User requireHost(Authentication authentication) {
        User user = requireUser(authentication);
        if (user.getRole() != RoleEnum.HOST && user.getRole() != RoleEnum.ADMIN) {
            throw new RuntimeException("Chỉ Host mới được xử lý đơn đặt phòng");
        }
        return user;
    }
}
