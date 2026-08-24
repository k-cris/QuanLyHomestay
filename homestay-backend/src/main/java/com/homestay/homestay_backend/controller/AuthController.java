package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.dto.UserResponseDto;
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
        response.put("user", UserResponseDto.from(user));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body("Chưa xác thực");
        }
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("Không tìm thấy người dùng");
        }
        return ResponseEntity.ok(UserResponseDto.from(user));
    }
}
