package com.homestay.homestay_backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CancelPreviewDto {
    private Long bookingId;
    private String bookingCode;
    private String bookingStatus;
    private boolean canCancel;
    private String reason;
    /** Số giờ còn lại trước check-in (so sánh DB/policy). */
    private long hoursBeforeCheckin;
    /** Số ngày hiển thị cho khách (làm tròn từ giờ). */
    private double daysBeforeCheckin;
    /** 100 nếu PENDING; còn lại lấy từ HomestayRefundRule. */
    private int refundPercent;
    private Double originalAmount;
    private Double refundAmount;
    private boolean willRefund;
    private String paymentStatus;
    private String message;
    /** Policy Homestay (giờ) — FE convert sang ngày khi hiện. */
    private List<RefundRuleView> refundRules;

    @Data
    @Builder
    public static class RefundRuleView {
        private Integer minHoursBefore;
        private Integer refundPercent;
        private Double displayDays;
    }
}
