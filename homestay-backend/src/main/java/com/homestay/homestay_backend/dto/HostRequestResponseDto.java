package com.homestay.homestay_backend.dto;

import com.homestay.homestay_backend.entity.HostRequest;
import com.homestay.homestay_backend.enums.RequestStatusEnum;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
public class HostRequestResponseDto {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private String userPhone;
    private String idCardNumber;
    private String licenseImageUrl;
    private List<String> documentImageUrls;
    private RequestStatusEnum status;
    private String adminNote;

    public static HostRequestResponseDto from(HostRequest req) {
        List<String> images = resolveImages(req);
        return HostRequestResponseDto.builder()
                .id(req.getId())
                .userId(req.getUser() != null ? req.getUser().getId() : null)
                .userEmail(req.getUser() != null ? req.getUser().getEmail() : null)
                .userFullName(req.getUser() != null ? req.getUser().getFullName() : null)
                .userPhone(req.getUser() != null ? req.getUser().getPhone() : null)
                .idCardNumber(req.getIdCardNumber())
                .licenseImageUrl(images.isEmpty() ? null : images.get(0))
                .documentImageUrls(images)
                .status(req.getStatus())
                .adminNote(req.getAdminNote())
                .build();
    }

    private static List<String> resolveImages(HostRequest req) {
        Set<String> unique = new LinkedHashSet<>();
        if (req.getDocumentImages() != null) {
            for (String url : req.getDocumentImages()) {
                if (url != null && !url.isBlank()) {
                    unique.add(url.trim());
                }
            }
        }
        if (unique.isEmpty() && req.getLicenseImageUrl() != null && !req.getLicenseImageUrl().isBlank()) {
            unique.add(req.getLicenseImageUrl().trim());
        }
        return new ArrayList<>(unique);
    }
}
