package com.homestay.homestay_backend.dto;

import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponseDto {
    private Long id;
    private Long bookingId;
    private String bookingCode;
    private String paymentMethod;
    private String transactionCode;
    private Double amount;
    private PaymentStatusEnum status;
    private LocalDateTime paidAt;
    private String receiverBankName;
    private String receiverBankHolder;
    private String receiverBankAccount;
    private LocalDateTime refundedAt;
    private String refundBankAccount;
    private String refundNote;

    public static PaymentResponseDto from(Payment payment) {
        Long bookingId = payment.getBooking() != null ? payment.getBooking().getId() : null;
        String bookingCode = payment.getBooking() != null ? payment.getBooking().getBookingCode() : null;
        return PaymentResponseDto.builder()
                .id(payment.getId())
                .bookingId(bookingId)
                .bookingCode(bookingCode)
                .paymentMethod(payment.getPaymentMethod())
                .transactionCode(payment.getTransactionCode())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .paidAt(payment.getPaidAt())
                .receiverBankName(payment.getReceiverBankName())
                .receiverBankHolder(payment.getReceiverBankHolder())
                .receiverBankAccount(payment.getReceiverBankAccount())
                .refundedAt(payment.getRefundedAt())
                .refundBankAccount(payment.getRefundBankAccount())
                .refundNote(payment.getRefundNote())
                .build();
    }
}
