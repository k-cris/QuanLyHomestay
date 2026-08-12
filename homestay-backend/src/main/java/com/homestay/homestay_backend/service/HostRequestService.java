package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.entity.HostRequest;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.RequestStatusEnum;
import com.homestay.homestay_backend.enums.RoleEnum;
import com.homestay.homestay_backend.repository.HostRequestRepository;
import com.homestay.homestay_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HostRequestService {
    private final HostRequestRepository hostRequestRepository;
    private final UserRepository userRepository;

    // Business Rule 3: Gửi yêu cầu lên Host (chỉ USER)
    @Transactional
    public HostRequest submitRequest(Long userId, String idCard, String licenseImg) {
        User user = userRepository.findById(userId).orElseThrow();
        if (user.getRole() != RoleEnum.USER) {
            throw new RuntimeException("Only USER can request to be HOST");
        }
        HostRequest req = HostRequest.builder()
                .user(user)
                .idCardNumber(idCard)
                .licenseImageUrl(licenseImg)
                .status(RequestStatusEnum.PENDING)
                .build();
        return hostRequestRepository.save(req);
    }

    // Business Rule 3: Admin duyệt -> đổi Role thành HOST
    @Transactional
    public void approveRequest(Long requestId) {
        HostRequest req = hostRequestRepository.findById(requestId).orElseThrow();
        req.setStatus(RequestStatusEnum.APPROVED);
        hostRequestRepository.save(req);

        User user = req.getUser();
        user.setRole(RoleEnum.HOST);
        userRepository.save(user);
    }

    // Business Rule 3: Admin từ chối -> ghi nhận adminNote
    @Transactional
    public void rejectRequest(Long requestId, String note) {
        HostRequest req = hostRequestRepository.findById(requestId).orElseThrow();
        req.setStatus(RequestStatusEnum.REJECTED);
        req.setAdminNote(note);
        hostRequestRepository.save(req);
    }
}
