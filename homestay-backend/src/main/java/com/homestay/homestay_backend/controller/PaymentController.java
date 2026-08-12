package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.dto.PaymentResponseDto;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.repository.UserRepository;
import com.homestay.homestay_backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> processPayment(@RequestBody Map<String, Object> payload, Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body("Chưa đăng nhập");
            }
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Long bookingId = Long.valueOf(payload.get("bookingId").toString());
            String method = payload.get("paymentMethod") != null
                    ? payload.get("paymentMethod").toString()
                    : "BANK_TRANSFER";

            PaymentResponseDto payment = paymentService.processPayment(bookingId, user.getId(), method);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
