package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.dto.UpdateProfileDto;
import com.homestay.homestay_backend.dto.UserResponseDto;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    /** UC-09: cập nhật hồ sơ + tài khoản ngân hàng */
    @PutMapping("/me")
    public ResponseEntity<?> updateMe(Authentication authentication, @RequestBody UpdateProfileDto body) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body("Chưa đăng nhập");
            }
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

            if (body.getFullName() != null && !body.getFullName().isBlank()) {
                user.setFullName(body.getFullName().trim());
            }
            if (body.getPhone() != null) {
                user.setPhone(body.getPhone().trim());
            }
            if (body.getAvatar() != null) {
                user.setAvatar(body.getAvatar().trim());
            }
            if (body.getBankName() != null) {
                user.setBankName(body.getBankName().trim());
            }
            if (body.getBankHolder() != null) {
                user.setBankHolder(body.getBankHolder().trim());
            }
            if (body.getBankAccount() != null) {
                user.setBankAccount(body.getBankAccount().trim());
            }

            boolean changingPassword = body.getPassword() != null && !body.getPassword().isBlank();
            if (changingPassword) {
                if (body.getCurrentPassword() == null || body.getCurrentPassword().isBlank()) {
                    throw new RuntimeException("Vui lòng nhập mật khẩu hiện tại để xác thực");
                }
                if (!user.getPassword().equals(body.getCurrentPassword())) {
                    throw new RuntimeException("Mật khẩu hiện tại không đúng");
                }
                if (body.getConfirmPassword() == null || !body.getPassword().equals(body.getConfirmPassword())) {
                    throw new RuntimeException("Xác nhận mật khẩu mới không khớp");
                }
                if (body.getPassword().length() < 6) {
                    throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự");
                }
                if (body.getPassword().equals(body.getCurrentPassword())) {
                    throw new RuntimeException("Mật khẩu mới phải khác mật khẩu hiện tại");
                }
                user.setPassword(body.getPassword());
            }

            userRepository.save(user);
            return ResponseEntity.ok(UserResponseDto.from(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
