package com.homestay.homestay_backend.repository;

import com.homestay.homestay_backend.entity.HostRequest;
import com.homestay.homestay_backend.enums.RequestStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HostRequestRepository extends JpaRepository<HostRequest, Long> {
    List<HostRequest> findByStatus(RequestStatusEnum status);
}
