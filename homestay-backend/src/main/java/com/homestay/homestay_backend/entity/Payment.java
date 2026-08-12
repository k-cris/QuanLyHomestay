package com.homestay.homestay_backend.entity;

import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "booking_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Booking booking;

    private String paymentMethod;
    private String transactionCode;
    private Double amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatusEnum status;

    private LocalDateTime paidAt;

    /** Snapshot STK chủ nhà nhận tiền lúc thanh toán */
    private String receiverBankName;
    private String receiverBankHolder;
    private String receiverBankAccount;

    /** BR-6: thời điểm hoàn tiền */
    private LocalDateTime refundedAt;

    /** BR-6: số tài khoản nhận hoàn tiền (của khách) */
    private String refundBankAccount;

    private String refundNote;
}
