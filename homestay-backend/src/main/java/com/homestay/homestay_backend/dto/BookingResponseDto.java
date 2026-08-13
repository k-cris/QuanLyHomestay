package com.homestay.homestay_backend.dto;

import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Homestay;
import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class BookingResponseDto {
    private Long id;
    private String bookingCode;
    private BookingStatusEnum status;
    private LocalDate checkinDate;
    private LocalDate checkoutDate;
    private Integer totalGuests;
    private Double totalPrice;
    private String note;
    private LocalDateTime createdAt;

    private Long guestId;
    private String guestFullName;
    private String guestEmail;
    private String guestPhone;
    private String guestBankName;
    private String guestBankHolder;
    private String guestBankAccount;

    private Long homestayId;
    private String homestayTitle;
    private String homestayCity;

    private Long hostId;
    private String hostFullName;
    private String hostBankName;
    private String hostBankHolder;
    private String hostBankAccount;

    private Long paymentId;
    private PaymentStatusEnum paymentStatus;
    private Double paymentAmount;
    private String paymentMethod;
    private String transactionCode;
    private LocalDateTime paidAt;
    private String receiverBankName;
    private String receiverBankHolder;
    private String receiverBankAccount;
    private LocalDateTime refundedAt;
    private String refundBankAccount;
    private String refundNote;
    private Integer refundPercent;
    private Double refundAmount;

    public static BookingResponseDto from(Booking booking) {
        User guest = booking.getGuest();
        Homestay homestay = booking.getHomestay();
        User host = homestay != null ? homestay.getHost() : null;
        Payment payment = booking.getPayment();

        BookingResponseDtoBuilder builder = BookingResponseDto.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .status(booking.getStatus())
                .checkinDate(booking.getCheckinDate())
                .checkoutDate(booking.getCheckoutDate())
                .totalGuests(booking.getTotalGuests())
                .totalPrice(booking.getTotalPrice())
                .note(booking.getNote())
                .createdAt(booking.getCreatedAt());

        if (guest != null) {
            builder.guestId(guest.getId())
                    .guestFullName(guest.getFullName())
                    .guestEmail(guest.getEmail())
                    .guestPhone(guest.getPhone())
                    .guestBankName(guest.getBankName())
                    .guestBankHolder(guest.getBankHolder())
                    .guestBankAccount(guest.getBankAccount());
        }

        if (homestay != null) {
            builder.homestayId(homestay.getId())
                    .homestayTitle(homestay.getTitle())
                    .homestayCity(homestay.getCity());
        }

        if (host != null) {
            builder.hostId(host.getId())
                    .hostFullName(host.getFullName())
                    .hostBankName(host.getBankName())
                    .hostBankHolder(host.getBankHolder())
                    .hostBankAccount(host.getBankAccount());
        }

        if (payment != null) {
            builder.paymentId(payment.getId())
                    .paymentStatus(payment.getStatus())
                    .paymentAmount(payment.getAmount())
                    .paymentMethod(payment.getPaymentMethod())
                    .transactionCode(payment.getTransactionCode())
                    .paidAt(payment.getPaidAt())
                    .receiverBankName(payment.getReceiverBankName())
                    .receiverBankHolder(payment.getReceiverBankHolder())
                    .receiverBankAccount(payment.getReceiverBankAccount())
                    .refundedAt(payment.getRefundedAt())
                    .refundBankAccount(payment.getRefundBankAccount())
                    .refundNote(payment.getRefundNote())
                    .refundPercent(payment.getRefundPercent())
                    .refundAmount(payment.getRefundAmount());
        }

        return builder.build();
    }
}
