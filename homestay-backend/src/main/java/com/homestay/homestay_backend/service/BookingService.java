package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.dto.BookingResponseDto;
import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Homestay;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.HomestayRepository;
import com.homestay.homestay_backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final HomestayRepository homestayRepository;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;

    // Business Rule 2: Kiểm tra trùng lịch
    @Transactional
    public Booking createBooking(Long guestId, Long homestayId, LocalDate checkinDate, LocalDate checkoutDate, Integer guests, String note) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));

        LocalDate today = LocalDate.now();
        if (checkinDate == null || checkoutDate == null) {
            throw new RuntimeException("Vui lòng chọn ngày nhận và trả phòng");
        }
        if (checkinDate.isBefore(today)) {
            throw new RuntimeException("Ngày nhận phòng phải lớn hơn hoặc bằng ngày hôm nay");
        }
        if (!checkoutDate.isAfter(checkinDate)) {
            throw new RuntimeException("Ngày trả phòng phải sau ngày nhận phòng");
        }

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

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getBookingsOfGuest(Long guestId) {
        return bookingRepository.findByGuestId(guestId).stream()
                .sorted(Comparator.comparing(Booking::getId).reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /** UC-06: đơn thuộc Homestay của Host */
    @Transactional(readOnly = true)
    public List<BookingResponseDto> getBookingsOfHost(Long hostId, BookingStatusEnum status) {
        return bookingRepository.findByHomestayHostId(hostId).stream()
                .filter(b -> status == null || b.getStatus() == status)
                .sorted(Comparator.comparing(Booking::getId).reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /** BR-5: Host confirm đơn thuộc Homestay mình */
    @Transactional
    public BookingResponseDto confirmBooking(Long hostId, Long bookingId) {
        Booking booking = loadOwnedBooking(hostId, bookingId);

        if (booking.getStatus() != BookingStatusEnum.PENDING) {
            throw new RuntimeException("Chỉ có thể duyệt đơn đang ở trạng thái PENDING");
        }

        booking.setStatus(BookingStatusEnum.CONFIRM);
        bookingRepository.save(booking);
        return toDto(booking);
    }

    /** BR-5 + BR-6: Host reject → Auto Refund nếu đã PAID */
    @Transactional
    public BookingResponseDto rejectBooking(Long hostId, Long bookingId) {
        Booking booking = loadOwnedBooking(hostId, bookingId);

        if (booking.getStatus() != BookingStatusEnum.PENDING) {
            throw new RuntimeException("Chỉ có thể từ chối đơn đang ở trạng thái PENDING");
        }

        // Ensure payment + guest loaded before status change / refund
        if (booking.getPayment() == null) {
            paymentRepository.findByBookingId(booking.getId()).ifPresent(booking::setPayment);
        }
        if (booking.getGuest() != null) {
            booking.getGuest().getBankAccount();
        }

        booking.setStatus(BookingStatusEnum.REJECTED);
        bookingRepository.save(booking);

        paymentService.triggerAutoRefund(booking);
        return toDto(booking);
    }

    /** BR-7 (dùng nội bộ / UC-08): hủy đơn + refund nếu PAID */
    @Transactional
    public BookingResponseDto cancelBooking(Long guestId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt phòng"));
        if (booking.getGuest() == null || !booking.getGuest().getId().equals(guestId)) {
            throw new RuntimeException("Unauthorized: Not your booking");
        }
        if (booking.getStatus() != BookingStatusEnum.PENDING && booking.getStatus() != BookingStatusEnum.CONFIRM) {
            throw new RuntimeException("Can only cancel PENDING or CONFIRM bookings");
        }
        if (booking.getPayment() == null) {
            paymentRepository.findByBookingId(booking.getId()).ifPresent(booking::setPayment);
        }

        booking.setStatus(BookingStatusEnum.CANCELLED);
        bookingRepository.save(booking);
        paymentService.triggerAutoRefund(booking);
        return toDto(booking);
    }

    private Booking loadOwnedBooking(Long hostId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt phòng"));

        if (booking.getHomestay() == null
                || booking.getHomestay().getHost() == null
                || !booking.getHomestay().getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized: Not your homestay");
        }
        return booking;
    }

    private BookingResponseDto toDto(Booking booking) {
        if (booking.getPayment() == null && booking.getId() != null) {
            paymentRepository.findByBookingId(booking.getId()).ifPresent(booking::setPayment);
        }
        if (booking.getGuest() != null) {
            booking.getGuest().getFullName();
            booking.getGuest().getBankAccount();
        }
        if (booking.getHomestay() != null) {
            booking.getHomestay().getTitle();
            if (booking.getHomestay().getHost() != null) {
                booking.getHomestay().getHost().getBankAccount();
                booking.getHomestay().getHost().getFullName();
            }
        }
        return BookingResponseDto.from(booking);
    }
}
