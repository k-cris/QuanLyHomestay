package com.homestay.homestay_backend.entity;

import com.homestay.homestay_backend.enums.RequestStatusEnum;
import jakarta.persistence.*;
import lombok.*;

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
    private String licenseImageUrl;

    @Enumerated(EnumType.STRING)
    private RequestStatusEnum status;

    private String adminNote;
}
