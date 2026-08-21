package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.config.HomestaySchedulerProperties;
import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Homestay;
import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingExpiryProcessorTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private HomestaySchedulerProperties schedulerProperties;

    @InjectMocks
    private BookingExpiryProcessor processor;

    private User guest;
    private Booking booking;

    @BeforeEach
    void setUp() {
        guest = User.builder()
                .id(1L)
                .bankAccount("123456789")
                .bankName("VCB")
                .bankHolder("Guest Name")
                .build();

        booking = Booking.builder()
                .id(10L)
                .bookingCode("BK-TEST001")
                .guest(guest)
                .homestay(Homestay.builder().id(2L).build())
                .checkinDate(LocalDate.now().plusDays(3))
                .checkoutDate(LocalDate.now().plusDays(5))
                .status(BookingStatusEnum.PENDING)
                .createdAt(LocalDateTime.now().minusHours(30))
                .build();
    }

    @Test
    void cancelUnpaidOverdue_cancelsPendingWithoutPayment() {
        when(schedulerProperties.getPaymentDeadlineHours()).thenReturn(24);
        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));
        when(paymentRepository.findByBookingId(10L)).thenReturn(Optional.empty());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        assertTrue(processor.cancelUnpaidOverdue(10L));
        assertEquals(BookingStatusEnum.CANCELLED, booking.getStatus());
        verify(paymentService, never()).triggerAutoRefund(any(), any(Integer.class));
    }

    @Test
    void cancelHostApprovalOverdue_cancelsAndRefundsPaidPending() {
        when(schedulerProperties.getHostApprovalDeadlineHours()).thenReturn(48);
        Payment payment = Payment.builder()
                .id(5L)
                .status(PaymentStatusEnum.PAID)
                .paidAt(LocalDateTime.now().minusHours(50))
                .amount(1_000_000.0)
                .build();
        booking.setPayment(payment);

        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentService.triggerAutoRefund(booking, 100)).thenReturn(payment);

        assertTrue(processor.cancelHostApprovalOverdue(10L));
        assertEquals(BookingStatusEnum.CANCELLED, booking.getStatus());
        verify(paymentService).triggerAutoRefund(booking, 100);
    }

    @Test
    void cancelUnpaidOverdue_skipsWhenAlreadyPaid() {
        Payment payment = Payment.builder()
                .status(PaymentStatusEnum.PAID)
                .paidAt(LocalDateTime.now())
                .build();
        booking.setPayment(payment);

        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        assertFalse(processor.cancelUnpaidOverdue(10L));
        verify(bookingRepository, never()).save(any());
    }
}
