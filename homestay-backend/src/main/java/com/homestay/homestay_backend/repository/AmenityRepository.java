package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AmenityRepository extends JpaRepository<Amenity, Long> {
    Optional<Amenity> findByName(String name);

    boolean existsByName(String name);
}
