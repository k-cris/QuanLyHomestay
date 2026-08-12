package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.HostRequest;
import com.homestay.homestay_backend.enums.RequestStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HostRequestRepository extends JpaRepository<HostRequest, Long> {
    List<HostRequest> findByStatus(RequestStatusEnum status);

    List<HostRequest> findAllByOrderByIdDesc();

    boolean existsByUserIdAndStatus(Long userId, RequestStatusEnum status);

    Optional<HostRequest> findFirstByUserIdOrderByIdDesc(Long userId);
}
