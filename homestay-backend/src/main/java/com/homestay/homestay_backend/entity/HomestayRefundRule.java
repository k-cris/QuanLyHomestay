package com.homestay.homestay_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Luật hoàn tiền theo Homestay.
 * Lưu theo giờ (minHoursBefore) để so sánh chính xác; FE hiển thị cho khách theo ngày.
 */
@Entity
@Table(name = "homestay_refund_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomestayRefundRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homestay_id", nullable = false)
    @JsonIgnore
    private Homestay homestay;

    /**
     * Hủy trước ít nhất N giờ so với check-in → áp dụng refundPercent.
     * Ví dụ: 72 = trước 3 ngày, 24 = trước 1 ngày, 0 = sát giờ nhận phòng.
     */
    @Column(nullable = false)
    private Integer minHoursBefore;

    /** Phần trăm hoàn (0–100) */
    @Column(nullable = false)
    private Integer refundPercent;
}
