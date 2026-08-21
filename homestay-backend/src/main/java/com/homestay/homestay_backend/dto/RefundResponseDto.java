package com.homestay.homestay_backend.dto;

import com.homestay.homestay_backend.entity.Refund;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RefundResponseDto {
    private Long id;
    private Long bookingId;
    private String bookingCode;
    private String homestayTitle;
    private Long userId;
    private String guestFullName;
    private String guestEmail;
    private Double amount;
    private String receiverBankName;
    private String receiverBankAccount;
    private String receiverBankHolder;
    private String reason;
    private String status;
    private String hostNote;
    private LocalDateTime requestedAt;
    private LocalDateTime sentAt;
    private LocalDateTime confirmedAt;

    public static RefundResponseDto from(Refund r) {
        return RefundResponseDto.builder()
                .id(r.getId())
                .bookingId(r.getBooking() != null ? r.getBooking().getId() : null)
                .bookingCode(r.getBooking() != null ? r.getBooking().getBookingCode() : null)
                .homestayTitle(r.getBooking() != null && r.getBooking().getHomestay() != null ? r.getBooking().getHomestay().getTitle() : null)
                .userId(r.getUser() != null ? r.getUser().getId() : null)
                .guestFullName(r.getUser() != null ? r.getUser().getFullName() : null)
                .guestEmail(r.getUser() != null ? r.getUser().getEmail() : null)
                .amount(r.getAmount() != null ? r.getAmount().doubleValue() : 0.0)
                .receiverBankName(r.getReceiverBankName())
                .receiverBankAccount(r.getReceiverBankAccount())
                .receiverBankHolder(r.getReceiverBankHolder())
                .reason(r.getReason())
                .status(r.getStatus())
                .hostNote(r.getHostNote())
                .requestedAt(r.getRequestedAt())
                .sentAt(r.getSentAt())
                .confirmedAt(r.getConfirmedAt())
                .build();
    }
}
