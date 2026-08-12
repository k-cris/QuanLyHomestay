package com.homestay.homestay_backend.controller;

import com.homestay.homestay_backend.repository.AmenityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/amenities")
@RequiredArgsConstructor
public class AmenityController {
    private final AmenityRepository amenityRepository;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(amenityRepository.findAll());
    }
}
