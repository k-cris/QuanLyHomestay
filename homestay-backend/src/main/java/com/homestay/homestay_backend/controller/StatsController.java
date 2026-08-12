package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.RoleEnum;
import com.homestay.homestay_backend.repository.UserRepository;
import com.homestay.homestay_backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {
    private final StatsService statsService;
    private final UserRepository userRepository;

    /**
     * UC-10 Host: doanh thu từng Homestay của mình + tổng.
     * year bắt buộc (mặc định năm hiện tại), month tuỳ chọn để xem từng tháng.
     */
    @GetMapping("/host")
    public ResponseEntity<?> hostStats(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        try {
            User user = requireUser(authentication);
            if (user.getRole() != RoleEnum.HOST && user.getRole() != RoleEnum.ADMIN) {
                return ResponseEntity.status(403).body("Chỉ Host mới xem thống kê của mình");
            }
            return ResponseEntity.ok(statsService.getHostStats(user.getId(), year, month));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * UC-10 Admin: doanh thu từng Homestay toàn hệ thống kèm tên chủ.
     */
    @GetMapping("/admin")
    public ResponseEntity<?> adminStats(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        try {
            User user = requireUser(authentication);
            if (user.getRole() != RoleEnum.ADMIN) {
                return ResponseEntity.status(403).body("Chỉ Admin mới xem thống kê toàn hệ thống");
            }
            return ResponseEntity.ok(statsService.getAdminStats(year, month));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private User requireUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Chưa đăng nhập");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }
}
