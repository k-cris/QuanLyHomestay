package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Homestay;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.HomestayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final HomestayRepository homestayRepository;
    private final PaymentService paymentService;

    public BookingRepository getBookingRepository() {
        return bookingRepository;
    }

    // Business Rule 2: Kiểm tra trùng lịch
    @Transactional
    public Booking createBooking(Long guestId, Long homestayId, LocalDate checkinDate, LocalDate checkoutDate, Integer guests, String note) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));

        long overlaps = bookingRepository.countOverlappingBookings(homestayId, checkinDate, checkoutDate);
        if (overlaps > 0) {
            throw new RuntimeException("Date overlap with an existing booking");
        }

        Booking booking = Booking.builder()
                .bookingCode("BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .guest(User.builder().id(guestId).build())
                .homestay(homestay)
                .checkinDate(checkinDate)
                .checkoutDate(checkoutDate)
                .totalGuests(guests)
                .totalPrice(homestay.getPricePerNight().doubleValue() * checkinDate.until(checkoutDate).getDays())
                .note(note)
                .status(BookingStatusEnum.PENDING)
                .createdAt(java.time.LocalDateTime.now())
                .build();
        return bookingRepository.save(booking);
    }

    // Business Rule 5: Host Reject -> Trigger Refund
    @Transactional
    public void rejectBooking(Long hostId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        if (!booking.getHomestay().getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized: Not your homestay");
        }
        booking.setStatus(BookingStatusEnum.REJECTED);
        bookingRepository.save(booking);
        
        paymentService.triggerAutoRefund(booking);
    }

    @Transactional
    public void confirmBooking(Long hostId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        if (!booking.getHomestay().getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized: Not your homestay");
        }
        booking.setStatus(BookingStatusEnum.CONFIRM);
        bookingRepository.save(booking);
    }

    // Business Rule 7: Khách hàng tự hủy đơn -> Trigger Refund
    @Transactional
    public void cancelBooking(Long guestId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId).orElseThrow();
        if (!booking.getGuest().getId().equals(guestId)) {
            throw new RuntimeException("Unauthorized: Not your booking");
        }
        if (booking.getStatus() != BookingStatusEnum.PENDING && booking.getStatus() != BookingStatusEnum.CONFIRM) {
            throw new RuntimeException("Can only cancel PENDING or CONFIRM bookings");
        }
        booking.setStatus(BookingStatusEnum.CANCELLED);
        bookingRepository.save(booking);

        paymentService.triggerAutoRefund(booking);
    }
}
