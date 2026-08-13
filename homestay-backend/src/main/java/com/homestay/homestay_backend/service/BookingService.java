package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.dto.BookingResponseDto;
import com.homestay.homestay_backend.dto.CancelPreviewDto;
import com.homestay.homestay_backend.entity.Booking;
import com.homestay.homestay_backend.entity.Homestay;
import com.homestay.homestay_backend.entity.HomestayRefundRule;
import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.BookingStatusEnum;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.HomestayRepository;
import com.homestay.homestay_backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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

    /** BR-5 + BR-6: Host reject → Auto Refund 100% nếu đã PAID */
    @Transactional
    public BookingResponseDto rejectBooking(Long hostId, Long bookingId) {
        Booking booking = loadOwnedBooking(hostId, bookingId);

        if (booking.getStatus() != BookingStatusEnum.PENDING) {
            throw new RuntimeException("Chỉ có thể từ chối đơn đang ở trạng thái PENDING");
        }

        if (booking.getPayment() == null) {
            paymentRepository.findByBookingId(booking.getId()).ifPresent(booking::setPayment);
        }
        if (booking.getGuest() != null) {
            booking.getGuest().getBankAccount();
        }

        booking.setStatus(BookingStatusEnum.REJECTED);
        bookingRepository.save(booking);

        paymentService.triggerAutoRefund(booking, 100);
        return toDto(booking);
    }

    /**
     * UC-08 preview: thông báo % hoàn trước khi khách xác nhận hủy.
     * PENDING → 100% (nếu PAID); CONFIRM → 95/90/85/80 theo ngày trước check-in.
     */
    @Transactional(readOnly = true)
    public CancelPreviewDto getCancelPreview(Long guestId, Long bookingId) {
        Booking booking = loadGuestBooking(guestId, bookingId);
        return buildCancelPreview(booking);
    }

    /**
     * UC-08 + BR-7: khách hủy đơn của mình (PENDING/CONFIRM, không sau ngày check-in)
     * → Auto Refund theo % nếu đã PAID.
     */
    @Transactional
    public BookingResponseDto cancelBooking(Long guestId, Long bookingId) {
        Booking booking = loadGuestBooking(guestId, bookingId);
        CancelPreviewDto preview = buildCancelPreview(booking);

        if (!preview.isCanCancel()) {
            throw new RuntimeException(preview.getReason() != null ? preview.getReason() : "Không thể hủy đơn này");
        }

        if (booking.getPayment() == null) {
            paymentRepository.findByBookingId(booking.getId()).ifPresent(booking::setPayment);
        }
        if (booking.getGuest() != null) {
            booking.getGuest().getBankAccount();
        }

        booking.setStatus(BookingStatusEnum.CANCELLED);
        bookingRepository.save(booking);

        if (preview.isWillRefund()) {
            paymentService.triggerAutoRefund(booking, preview.getRefundPercent());
        }

        return toDto(booking);
    }

    private CancelPreviewDto buildCancelPreview(Booking booking) {
        ensurePaymentLoaded(booking);

        Payment payment = booking.getPayment();
        double original = payment != null && payment.getAmount() != null
                ? payment.getAmount()
                : (booking.getTotalPrice() != null ? booking.getTotalPrice() : 0);
        boolean isPaid = payment != null && payment.getStatus() == PaymentStatusEnum.PAID;

        List<HomestayRefundRule> rules = loadRefundRules(booking);
        List<CancelPreviewDto.RefundRuleView> ruleViews = toRuleViews(rules);

        CancelPreviewDto.CancelPreviewDtoBuilder builder = CancelPreviewDto.builder()
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .bookingStatus(booking.getStatus() != null ? booking.getStatus().name() : null)
                .originalAmount(original)
                .paymentStatus(payment != null && payment.getStatus() != null ? payment.getStatus().name() : null)
                .refundRules(ruleViews);

        if (booking.getStatus() != BookingStatusEnum.PENDING && booking.getStatus() != BookingStatusEnum.CONFIRM) {
            return builder
                    .canCancel(false)
                    .reason("Chỉ hủy được đơn đang PENDING hoặc CONFIRM")
                    .hoursBeforeCheckin(0)
                    .daysBeforeCheckin(0)
                    .refundPercent(0)
                    .refundAmount(0.0)
                    .willRefund(false)
                    .message("Đơn này không thể hủy.")
                    .build();
        }

        LocalDate checkin = booking.getCheckinDate();
        if (checkin == null) {
            return builder
                    .canCancel(false)
                    .reason("Đơn thiếu ngày nhận phòng")
                    .hoursBeforeCheckin(0)
                    .daysBeforeCheckin(0)
                    .refundPercent(0)
                    .refundAmount(0.0)
                    .willRefund(false)
                    .message("Không thể hủy vì thiếu ngày nhận phòng.")
                    .build();
        }

        LocalDateTime checkinAt = checkin.atStartOfDay();
        long hoursBefore = ChronoUnit.HOURS.between(LocalDateTime.now(), checkinAt);
        double daysDisplay = Math.round((hoursBefore / 24.0) * 10.0) / 10.0;

        if (hoursBefore < 0) {
            return builder
                    .canCancel(false)
                    .reason("Không thể hủy sau thời điểm nhận phòng")
                    .hoursBeforeCheckin(hoursBefore)
                    .daysBeforeCheckin(daysDisplay)
                    .refundPercent(0)
                    .refundAmount(0.0)
                    .willRefund(false)
                    .message("Đã qua ngày nhận phòng, không thể hủy đơn.")
                    .build();
        }

        int percent;
        String policyText;
        if (booking.getStatus() == BookingStatusEnum.PENDING) {
            percent = 100;
            policyText = "Đơn chưa được Host duyệt — hoàn 100% nếu đã thanh toán.";
        } else {
            percent = HomestayService.resolveRefundPercent(rules, hoursBefore);
            policyText = String.format(
                    "Theo chính sách Homestay: hủy trước khoảng %.1f ngày (còn %d giờ) — hoàn %d%%.",
                    daysDisplay,
                    hoursBefore,
                    percent
            );
        }

        double refundAmount = isPaid ? Math.round(original * percent) / 100.0 : 0.0;
        String message;
        if (!isPaid) {
            message = String.format(
                    "Bạn sắp hủy đơn %s. Đơn chưa thanh toán nên không phát sinh hoàn tiền. %s",
                    booking.getBookingCode(),
                    policyText
            );
        } else {
            message = String.format(
                    "Bạn sắp hủy đơn %s. Còn khoảng %.1f ngày trước nhận phòng. Theo chính sách sẽ hoàn %d%% (%.0f ₫ / %.0f ₫) về STK của bạn. %s",
                    booking.getBookingCode(),
                    daysDisplay,
                    percent,
                    refundAmount,
                    original,
                    policyText
            );
        }

        return builder
                .canCancel(true)
                .reason(null)
                .hoursBeforeCheckin(hoursBefore)
                .daysBeforeCheckin(daysDisplay)
                .refundPercent(percent)
                .refundAmount(refundAmount)
                .willRefund(isPaid)
                .message(message)
                .build();
    }

    private List<HomestayRefundRule> loadRefundRules(Booking booking) {
        Homestay hs = booking.getHomestay();
        if (hs == null) {
            return HomestayService.defaultRefundRules();
        }
        if (hs.getRefundRules() == null || hs.getRefundRules().isEmpty()) {
            // re-fetch to load rules if lazy
            Homestay full = homestayRepository.findById(hs.getId()).orElse(hs);
            if (full.getRefundRules() != null) {
                full.getRefundRules().size();
            }
            if (full.getRefundRules() == null || full.getRefundRules().isEmpty()) {
                return HomestayService.defaultRefundRules();
            }
            return full.getRefundRules();
        }
        return hs.getRefundRules();
    }

    private List<CancelPreviewDto.RefundRuleView> toRuleViews(List<HomestayRefundRule> rules) {
        if (rules == null) return new ArrayList<>();
        return rules.stream()
                .sorted(Comparator.comparingInt(HomestayRefundRule::getMinHoursBefore).reversed())
                .map(r -> CancelPreviewDto.RefundRuleView.builder()
                        .minHoursBefore(r.getMinHoursBefore())
                        .refundPercent(r.getRefundPercent())
                        .displayDays(r.getMinHoursBefore() == null
                                ? 0.0
                                : Math.round((r.getMinHoursBefore() / 24.0) * 10.0) / 10.0)
                        .build())
                .collect(Collectors.toList());
    }

    private Booking loadGuestBooking(Long guestId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt phòng"));
        if (booking.getGuest() == null || !booking.getGuest().getId().equals(guestId)) {
            throw new RuntimeException("Unauthorized: Not your booking");
        }
        return booking;
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

    private void ensurePaymentLoaded(Booking booking) {
        if (booking.getPayment() == null && booking.getId() != null) {
            paymentRepository.findByBookingId(booking.getId()).ifPresent(booking::setPayment);
        }
    }

    private BookingResponseDto toDto(Booking booking) {
        ensurePaymentLoaded(booking);
        if (booking.getGuest() != null) {
            booking.getGuest().getFullName();
            booking.getGuest().getBankAccount();
        }
        if (booking.getHomestay() != null) {
            booking.getHomestay().getTitle();
            if (booking.getHomestay().getRefundRules() != null) {
                booking.getHomestay().getRefundRules().size();
            }
            if (booking.getHomestay().getHost() != null) {
                booking.getHomestay().getHost().getBankAccount();
                booking.getHomestay().getHost().getFullName();
            }
        }
        return BookingResponseDto.from(booking);
    }
}
