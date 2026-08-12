package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
}
