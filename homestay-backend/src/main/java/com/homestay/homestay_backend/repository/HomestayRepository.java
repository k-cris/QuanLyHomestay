package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.Homestay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HomestayRepository extends JpaRepository<Homestay, Long> {
    List<Homestay> findByHostId(Long hostId);
}
