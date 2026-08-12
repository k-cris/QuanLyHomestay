package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.dto.HostRequestResponseDto;
import com.homestay.homestay_backend.entity.HostRequest;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.RequestStatusEnum;
import com.homestay.homestay_backend.enums.RoleEnum;
import com.homestay.homestay_backend.repository.HostRequestRepository;
import com.homestay.homestay_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HostRequestService {
    private final HostRequestRepository hostRequestRepository;
    private final UserRepository userRepository;

    /** BR-3: chỉ ROLE_USER mới gửi được HostRequest */
    @Transactional
    public HostRequestResponseDto submitRequest(Long userId, String idCard, List<String> imageUrls) {
        if (idCard == null || idCard.isBlank()) {
            throw new RuntimeException("Vui lòng nhập số CCCD");
        }

        List<String> images = normalizeImages(imageUrls);
        if (images.isEmpty()) {
            throw new RuntimeException("Vui lòng tải ít nhất 1 ảnh giấy tờ");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (user.getRole() != RoleEnum.USER) {
            throw new RuntimeException("Chỉ tài khoản USER mới được gửi yêu cầu trở thành Host");
        }

        if (hostRequestRepository.existsByUserIdAndStatus(userId, RequestStatusEnum.PENDING)) {
            throw new RuntimeException("Bạn đã có yêu cầu đang chờ duyệt");
        }

        HostRequest req = HostRequest.builder()
                .user(user)
                .idCardNumber(idCard.trim())
                .licenseImageUrl(images.get(0))
                .documentImages(new ArrayList<>(images))
                .status(RequestStatusEnum.PENDING)
                .build();

        return HostRequestResponseDto.from(hostRequestRepository.save(req));
    }

    @Transactional(readOnly = true)
    public List<HostRequestResponseDto> getAllRequests() {
        return hostRequestRepository.findAllByOrderByIdDesc().stream()
                .map(HostRequestResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<HostRequestResponseDto> getRequestsByStatus(RequestStatusEnum status) {
        return hostRequestRepository.findByStatus(status).stream()
                .map(HostRequestResponseDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HostRequestResponseDto getLatestRequestOfUser(Long userId) {
        return hostRequestRepository.findFirstByUserIdOrderByIdDesc(userId)
                .map(HostRequestResponseDto::from)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public HostRequestResponseDto getById(Long requestId) {
        HostRequest req = hostRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));
        return HostRequestResponseDto.from(req);
    }

    /** BR-3: Admin duyệt → cập nhật role = HOST */
    @Transactional
    public HostRequestResponseDto approveRequest(Long requestId) {
        HostRequest req = hostRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));

        if (req.getStatus() != RequestStatusEnum.PENDING) {
            throw new RuntimeException("Chỉ có thể duyệt yêu cầu đang ở trạng thái PENDING");
        }

        req.setStatus(RequestStatusEnum.APPROVED);
        hostRequestRepository.save(req);

        User user = req.getUser();
        user.setRole(RoleEnum.HOST);
        userRepository.save(user);

        return HostRequestResponseDto.from(req);
    }

    /** BR-3: từ chối → lưu adminNote */
    @Transactional
    public HostRequestResponseDto rejectRequest(Long requestId, String note) {
        if (note == null || note.isBlank()) {
            throw new RuntimeException("Vui lòng nhập lý do từ chối (adminNote)");
        }

        HostRequest req = hostRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu"));

        if (req.getStatus() != RequestStatusEnum.PENDING) {
            throw new RuntimeException("Chỉ có thể từ chối yêu cầu đang ở trạng thái PENDING");
        }

        req.setStatus(RequestStatusEnum.REJECTED);
        req.setAdminNote(note.trim());
        hostRequestRepository.save(req);

        return HostRequestResponseDto.from(req);
    }

    private List<String> normalizeImages(List<String> imageUrls) {
        Set<String> unique = new LinkedHashSet<>();
        if (imageUrls != null) {
            for (String url : imageUrls) {
                if (url != null && !url.isBlank()) {
                    unique.add(url.trim());
                }
            }
        }
        return new ArrayList<>(unique);
    }
}
