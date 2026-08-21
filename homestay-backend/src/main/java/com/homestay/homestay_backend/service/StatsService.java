package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.dto.HomestayRevenueDto;
import com.homestay.homestay_backend.dto.MonthlyRevenuePointDto;
import com.homestay.homestay_backend.dto.RevenueStatsResponse;
import com.homestay.homestay_backend.entity.Homestay;
import com.homestay.homestay_backend.entity.Payment;
import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.PaymentStatusEnum;
import com.homestay.homestay_backend.repository.HomestayRepository;
import com.homestay.homestay_backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * UC-10 + BR-10: thống kê doanh thu.
 * Doanh thu = tổng payment.status = PAID (đã nhận, chưa hoàn) theo paidAt.
 */
@Service
@RequiredArgsConstructor
public class StatsService {
    private final PaymentRepository paymentRepository;
    private final HomestayRepository homestayRepository;

    @Transactional(readOnly = true)
    public RevenueStatsResponse getHostStats(Long hostId, Integer year, Integer month) {
        List<Homestay> hostHomestays = homestayRepository.findByHostId(hostId);
        List<Payment> paid = paymentRepository.findAllByStatusWithDetails(PaymentStatusEnum.PAID).stream()
                .filter(p -> p.getBooking() != null
                        && p.getBooking().getHomestay() != null
                        && p.getBooking().getHomestay().getHost() != null
                        && Objects.equals(p.getBooking().getHomestay().getHost().getId(), hostId))
                .collect(Collectors.toList());

        return buildStats(paid, hostHomestays, year, month, false);
    }

    @Transactional(readOnly = true)
    public RevenueStatsResponse getAdminStats(Integer year, Integer month) {
        List<Homestay> allHomestays = homestayRepository.findAll();
        List<Payment> paid = paymentRepository.findAllByStatusWithDetails(PaymentStatusEnum.PAID);
        return buildStats(paid, allHomestays, year, month, true);
    }

    private RevenueStatsResponse buildStats(
            List<Payment> paidPayments,
            List<Homestay> scopeHomestays,
            Integer yearParam,
            Integer monthParam,
            boolean includeHostInfo
    ) {
        List<Integer> availableYears = resolveAvailableYears(paidPayments);
        int year = yearParam != null ? yearParam : YearMonth.now().getYear();
        if (!availableYears.contains(year)) {
            availableYears.add(year);
            availableYears = availableYears.stream().distinct().sorted().collect(Collectors.toList());
        }

        boolean monthMode = monthParam != null;
        if (monthMode && (monthParam < 1 || monthParam > 12)) {
            throw new RuntimeException("Tháng không hợp lệ (1-12)");
        }

        List<Payment> filtered = paidPayments.stream()
                .filter(p -> p.getBooking() != null && p.getBooking().getCheckinDate() != null)
                .filter(p -> {
                    java.time.LocalDate checkin = p.getBooking().getCheckinDate();
                    if (checkin.getYear() != year) return false;
                    if (monthMode && checkin.getMonthValue() != monthParam) return false;
                    return true;
                })
                .collect(Collectors.toList());

        Map<Long, HomestayRevenueDto> byHomestay = new HashMap<>();

        // Đảm bảo mọi Homestay trong scope đều xuất hiện (revenue = 0 nếu không có đơn)
        for (Homestay h : scopeHomestays) {
            byHomestay.put(h.getId(), toHomestayDto(h, 0, 0, includeHostInfo));
        }

        for (Payment p : filtered) {
            Homestay h = p.getBooking().getHomestay();
            if (h == null || h.getId() == null) continue;
            HomestayRevenueDto current = byHomestay.getOrDefault(
                    h.getId(),
                    toHomestayDto(h, 0, 0, includeHostInfo)
            );
            double amount = p.getAmount() != null ? p.getAmount() : 0;
            byHomestay.put(h.getId(), HomestayRevenueDto.builder()
                    .homestayId(current.getHomestayId())
                    .homestayTitle(current.getHomestayTitle())
                    .city(current.getCity())
                    .hostId(current.getHostId())
                    .hostFullName(current.getHostFullName())
                    .hostEmail(current.getHostEmail())
                    .revenue(current.getRevenue() + amount)
                    .bookingCount(current.getBookingCount() + 1)
                    .build());
        }

        List<HomestayRevenueDto> homestayList = byHomestay.values().stream()
                .sorted(Comparator.comparing(HomestayRevenueDto::getRevenue).reversed()
                        .thenComparing(HomestayRevenueDto::getHomestayTitle, Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toList());

        double totalRevenue = homestayList.stream().mapToDouble(HomestayRevenueDto::getRevenue).sum();
        long totalBookings = homestayList.stream().mapToLong(HomestayRevenueDto::getBookingCount).sum();

        List<MonthlyRevenuePointDto> monthlySeries = new ArrayList<>();
        if (!monthMode) {
            Map<Integer, double[]> monthAgg = new HashMap<>();
            for (int m = 1; m <= 12; m++) {
                monthAgg.put(m, new double[]{0, 0});
            }
            paidPayments.stream()
                    .filter(p -> p.getBooking() != null && p.getBooking().getCheckinDate() != null && p.getBooking().getCheckinDate().getYear() == year)
                    .forEach(p -> {
                        int m = p.getBooking().getCheckinDate().getMonthValue();
                        double[] arr = monthAgg.get(m);
                        arr[0] += p.getAmount() != null ? p.getAmount() : 0;
                        arr[1] += 1;
                    });
            monthlySeries = IntStream.rangeClosed(1, 12)
                    .mapToObj(m -> MonthlyRevenuePointDto.builder()
                            .month(m)
                            .label("T" + m)
                            .revenue(monthAgg.get(m)[0])
                            .bookingCount((long) monthAgg.get(m)[1])
                            .build())
                    .collect(Collectors.toList());
        }

        return RevenueStatsResponse.builder()
                .mode(monthMode ? "month" : "year")
                .year(year)
                .month(monthMode ? monthParam : null)
                .totalRevenue(totalRevenue)
                .totalBookings(totalBookings)
                .totalHomestays(scopeHomestays.size())
                .homestays(homestayList)
                .monthlySeries(monthlySeries)
                .availableYears(availableYears)
                .build();
    }

    private HomestayRevenueDto toHomestayDto(Homestay h, double revenue, long bookingCount, boolean includeHostInfo) {
        User host = h.getHost();
        return HomestayRevenueDto.builder()
                .homestayId(h.getId())
                .homestayTitle(h.getTitle())
                .city(h.getCity())
                .hostId(includeHostInfo && host != null ? host.getId() : null)
                .hostFullName(includeHostInfo && host != null ? host.getFullName() : null)
                .hostEmail(includeHostInfo && host != null ? host.getEmail() : null)
                .revenue(revenue)
                .bookingCount(bookingCount)
                .build();
    }

    private List<Integer> resolveAvailableYears(List<Payment> paidPayments) {
        List<Integer> years = paidPayments.stream()
                .map(Payment::getBooking)
                .filter(Objects::nonNull)
                .map(com.homestay.homestay_backend.entity.Booking::getCheckinDate)
                .filter(Objects::nonNull)
                .map(java.time.LocalDate::getYear)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
        int current = YearMonth.now().getYear();
        if (!years.contains(current)) {
            years.add(current);
            years = years.stream().sorted().collect(Collectors.toList());
        }
        return years;
    }
}
