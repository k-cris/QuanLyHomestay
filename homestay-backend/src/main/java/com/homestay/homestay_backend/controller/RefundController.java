package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.dto.RefundResponseDto;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.RoleEnum;
import com.homestay.homestay_backend.repository.UserRepository;
import com.homestay.homestay_backend.service.RefundService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/refunds")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;
    private final UserRepository userRepository;

    /**
     * Host xem danh sách các yêu cầu hoàn tiền
     */
    @GetMapping("/host")
    public ResponseEntity<?> getHostRefunds(Authentication authentication) {
        try {
            User host = requireUser(authentication);

            if (host.getRole() != RoleEnum.HOST
                    && host.getRole() != RoleEnum.ADMIN) {
                return ResponseEntity.status(403)
                        .body("Chỉ Host hoặc Admin mới được xem danh sách hoàn tiền");
            }

            if (host.getRole() == RoleEnum.ADMIN) {
                return ResponseEntity.ok(refundService.getAllRefunds());
            }

            return ResponseEntity.ok(
                    refundService.getHostRefunds(host.getId())
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Guest xem các yêu cầu hoàn tiền của mình
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyRefunds(Authentication authentication) {
        try {
            User guest = requireUser(authentication);

            return ResponseEntity.ok(
                    refundService.getMyRefunds(guest.getId())
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Xem chi tiết Refund
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @PathVariable Long id,
            Authentication authentication) {

        try {
            User user = requireUser(authentication);

            return ResponseEntity.ok(
                    refundService.getById(
                            id,
                            user.getId(),
                            user.getRole()
                    )
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Host xác nhận đã chuyển khoản
     */
    @PutMapping("/{id}/confirm-sent")
    public ResponseEntity<?> confirmSent(
            @PathVariable Long id,
            Authentication authentication) {

        try {
            User host = requireUser(authentication);

            if (host.getRole() != RoleEnum.HOST
                    && host.getRole() != RoleEnum.ADMIN) {
                return ResponseEntity.status(403)
                        .body("Chỉ Host mới có thể xác nhận đã chuyển tiền");
            }

            return ResponseEntity.ok(
                    refundService.confirmSent(id, host.getId())
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Guest xác nhận đã nhận tiền
     */
    @PutMapping("/{id}/confirm-received")
    public ResponseEntity<?> confirmReceived(
            @PathVariable Long id,
            Authentication authentication) {

        try {
            User guest = requireUser(authentication);

            return ResponseEntity.ok(
                    refundService.confirmReceived(id, guest.getId())
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Lấy User hiện tại từ email trong JWT
     */
    private User requireUser(Authentication authentication) {

        if (authentication == null
                || authentication.getName() == null
                || authentication.getName().isBlank()) {

            throw new RuntimeException("Chưa đăng nhập");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));
    }
}