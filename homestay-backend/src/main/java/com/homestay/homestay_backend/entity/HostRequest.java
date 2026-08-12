package com.homestay.homestay_backend.entity;

import com.homestay.homestay_backend.enums.RequestStatusEnum;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "host_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String idCardNumber;

    /** Giữ field cũ để tương thích dữ liệu đã có; ảnh mới lưu trong documentImages */
    private String licenseImageUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "host_request_images", joinColumns = @JoinColumn(name = "host_request_id"))
    @Column(name = "image_url", length = 1000)
    @Builder.Default
    private List<String> documentImages = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private RequestStatusEnum status;

    private String adminNote;
}
