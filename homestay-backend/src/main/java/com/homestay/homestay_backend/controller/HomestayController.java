package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.service.HomestayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/homestays")
public class HomestayController {
    @Autowired
    private HomestayService homestayService;
    
    @Autowired
    private com.homestay.homestay_backend.repository.UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllHomestays(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(homestayService.filterHomestays(city, minPrice, maxPrice, keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHomestayById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(homestayService.getHomestayById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHomestay(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        try {
            com.homestay.homestay_backend.entity.User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
            homestayService.deleteHomestay(user.getId(), id);
            return ResponseEntity.ok("Homestay deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/host")
    public ResponseEntity<?> getHostHomestays(org.springframework.security.core.Authentication authentication) {
        try {
            com.homestay.homestay_backend.entity.User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
            return ResponseEntity.ok(homestayService.getHomestaysByHost(user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createHomestay(@RequestBody com.homestay.homestay_backend.entity.Homestay homestay, org.springframework.security.core.Authentication authentication) {
        try {
            com.homestay.homestay_backend.entity.User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
            return ResponseEntity.ok(homestayService.createHomestay(user.getId(), homestay));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHomestay(@PathVariable Long id, @RequestBody com.homestay.homestay_backend.entity.Homestay updated, org.springframework.security.core.Authentication authentication) {
        try {
            com.homestay.homestay_backend.entity.User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
            return ResponseEntity.ok(homestayService.updateHomestay(user.getId(), id, updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
