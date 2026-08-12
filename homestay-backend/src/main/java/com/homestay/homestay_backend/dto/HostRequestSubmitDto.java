package com.homestay.homestay_backend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class HostRequestSubmitDto {
    private String idCardNumber;
    /** Danh sách URL ảnh giấy tờ (CCCD 2 mặt, giấy phép kinh doanh, ...) */
    private List<String> documentImageUrls = new ArrayList<>();
    /** Tương thích cũ: nếu chỉ gửi 1 ảnh */
    private String licenseImageUrl;
}
