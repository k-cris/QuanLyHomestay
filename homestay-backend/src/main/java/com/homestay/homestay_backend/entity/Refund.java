package com.homestay.homestay_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "refunds")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Refund {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "receiver_bank_name", length = 100)
    private String receiverBankName;

    @Column(name = "receiver_bank_account", length = 50)
    private String receiverBankAccount;

    @Column(name = "receiver_bank_holder")
    private String receiverBankHolder;

    @Column(nullable = false, length = 20)
    private String reason; // REJECTED, CANCELLED

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, SENT, CONFIRMED

    @Column(name = "host_note", columnDefinition = "TEXT")
    private String hostNote;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @PrePersist
    protected void onCreate() {
        if (requestedAt == null) requestedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }
}
