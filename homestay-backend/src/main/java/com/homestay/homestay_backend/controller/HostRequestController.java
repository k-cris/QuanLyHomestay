package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.dto.HostRequestRejectDto;
import com.homestay.homestay_backend.dto.HostRequestResponseDto;
import com.homestay.homestay_backend.dto.HostRequestSubmitDto;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.RequestStatusEnum;
import com.homestay.homestay_backend.repository.UserRepository;
import com.homestay.homestay_backend.service.HostRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/host-requests")
@RequiredArgsConstructor
public class HostRequestController {
    private final HostRequestService hostRequestService;
    private final UserRepository userRepository;

    /** UC-04: ROLE_USER gửi yêu cầu trở thành Host */
    @PostMapping
    public ResponseEntity<?> submit(Authentication authentication, @RequestBody HostRequestSubmitDto body) {
        try {
            User user = requireUser(authentication);
            List<String> images = new ArrayList<>();
            if (body.getDocumentImageUrls() != null) {
                images.addAll(body.getDocumentImageUrls());
            }
            if (body.getLicenseImageUrl() != null && !body.getLicenseImageUrl().isBlank()) {
                images.add(body.getLicenseImageUrl());
            }
            HostRequestResponseDto created = hostRequestService.submitRequest(
                    user.getId(),
                    body.getIdCardNumber(),
                    images
            );
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC-04: User xem trạng thái yêu cầu mới nhất của mình */
    @GetMapping("/me")
    public ResponseEntity<?> myLatest(Authentication authentication) {
        try {
            User user = requireUser(authentication);
            HostRequestResponseDto latest = hostRequestService.getLatestRequestOfUser(user.getId());
            return ResponseEntity.ok(latest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC-04: ROLE_ADMIN xem danh sách hồ sơ */
    @GetMapping
    public ResponseEntity<?> listAll(
            Authentication authentication,
            @RequestParam(required = false) RequestStatusEnum status
    ) {
        try {
            requireAdmin(authentication);
            if (status != null) {
                return ResponseEntity.ok(hostRequestService.getRequestsByStatus(status));
            }
            return ResponseEntity.ok(hostRequestService.getAllRequests());
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    /** UC-04: ROLE_ADMIN xem chi tiết 1 hồ sơ */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(Authentication authentication, @PathVariable Long id) {
        try {
            requireAdmin(authentication);
            return ResponseEntity.ok(hostRequestService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC-04 + BR-3: Admin duyệt → role = HOST */
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(Authentication authentication, @PathVariable Long id) {
        try {
            requireAdmin(authentication);
            return ResponseEntity.ok(hostRequestService.approveRequest(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** UC-04 + BR-3: Admin từ chối → lưu adminNote */
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody HostRequestRejectDto body
    ) {
        try {
            requireAdmin(authentication);
            return ResponseEntity.ok(hostRequestService.rejectRequest(id, body.getAdminNote()));
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

    private void requireAdmin(Authentication authentication) {
        User user = requireUser(authentication);
        if (user.getRole() != com.homestay.homestay_backend.enums.RoleEnum.ADMIN) {
            throw new RuntimeException("Chỉ Admin mới được thực hiện thao tác này");
        }
    }
}
