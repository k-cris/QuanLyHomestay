package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.entity.Amenity;
import com.homestay.homestay_backend.entity.Homestay;
import com.homestay.homestay_backend.entity.HomestayRefundRule;
import com.homestay.homestay_backend.repository.AmenityRepository;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.HomestayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HomestayService {
    private final HomestayRepository homestayRepository;
    private final BookingRepository bookingRepository;
    private final AmenityRepository amenityRepository;

    /** Mặc định hệ thống (giờ) nếu Host không cấu hình */
    public static List<HomestayRefundRule> defaultRefundRules() {
        List<HomestayRefundRule> rules = new ArrayList<>();
        rules.add(HomestayRefundRule.builder().minHoursBefore(72).refundPercent(95).build());
        rules.add(HomestayRefundRule.builder().minHoursBefore(48).refundPercent(90).build());
        rules.add(HomestayRefundRule.builder().minHoursBefore(24).refundPercent(85).build());
        rules.add(HomestayRefundRule.builder().minHoursBefore(0).refundPercent(80).build());
        return rules;
    }

    /**
     * Chọn % hoàn: rule có minHoursBefore lớn nhất mà hoursUntil >= minHoursBefore.
     * Không khớp → lấy bậc thấp nhất (minHoursBefore nhỏ nhất), fallback 80.
     */
    public static int resolveRefundPercent(List<HomestayRefundRule> rules, long hoursUntilCheckin) {
        List<HomestayRefundRule> list = (rules == null || rules.isEmpty())
                ? defaultRefundRules()
                : rules;

        return list.stream()
                .filter(r -> r.getMinHoursBefore() != null && r.getRefundPercent() != null)
                .filter(r -> hoursUntilCheckin >= r.getMinHoursBefore())
                .max(Comparator.comparingInt(HomestayRefundRule::getMinHoursBefore))
                .map(HomestayRefundRule::getRefundPercent)
                .orElseGet(() -> list.stream()
                        .filter(r -> r.getMinHoursBefore() != null && r.getRefundPercent() != null)
                        .min(Comparator.comparingInt(HomestayRefundRule::getMinHoursBefore))
                        .map(HomestayRefundRule::getRefundPercent)
                        .orElse(80));
    }

    // Fallback: Delete is now soft-delete (INACTIVE)
    @Transactional
    public void deleteHomestay(Long hostId, Long homestayId) {
        Homestay homestay = homestayRepository.findById(homestayId).orElseThrow();
        if (!homestay.getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized");
        }
        homestay.setStatus(com.homestay.homestay_backend.enums.HomestayStatusEnum.INACTIVE);
        homestayRepository.save(homestay);
    }

    @Transactional
    public void updateHomestayStatus(Long hostId, Long homestayId, String status) {
        Homestay homestay = homestayRepository.findById(homestayId).orElseThrow();
        if (!homestay.getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        try {
            homestay.setStatus(com.homestay.homestay_backend.enums.HomestayStatusEnum.valueOf(status.toUpperCase()));
            homestayRepository.save(homestay);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ");
        }
    }

    @Transactional
    public void updateAverageRating(Long homestayId, double newAverage) {
        Homestay homestay = homestayRepository.findById(homestayId).orElseThrow();
        homestay.setAverageRating(newAverage);
        homestayRepository.save(homestay);
    }

    public java.util.List<Homestay> getAllHomestays() {
        return homestayRepository.findAll();
    }
    
    private String normalizeString(String str) {
        if (str == null) return "";
        String normalized = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        return java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+")
                .matcher(normalized).replaceAll("")
                .replace("đ", "d").replace("Đ", "D")
                .toLowerCase().trim();
    }

    public java.util.List<Homestay> filterHomestays(String city, Double minPrice, Double maxPrice, String keyword) {
        String normalizedCity = normalizeString(city);
        String normalizedKeyword = normalizeString(keyword);

        return homestayRepository.findAll().stream()
            .filter(h -> "ACTIVE".equals(h.getStatus() != null ? h.getStatus().name() : "ACTIVE"))
            .filter(h -> city == null || city.trim().isEmpty() || normalizeString(h.getCity()).contains(normalizedCity))
            .filter(h -> minPrice == null || (h.getPricePerNight() != null && h.getPricePerNight().compareTo(java.math.BigDecimal.valueOf(minPrice)) >= 0))
            .filter(h -> maxPrice == null || (h.getPricePerNight() != null && h.getPricePerNight().compareTo(java.math.BigDecimal.valueOf(maxPrice)) <= 0))
            .filter(h -> keyword == null || keyword.trim().isEmpty() || 
                        normalizeString(h.getTitle()).contains(normalizedKeyword) ||
                        normalizeString(h.getDescription()).contains(normalizedKeyword))
            .collect(java.util.stream.Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Homestay getHomestayById(Long id) {
        Homestay homestay = homestayRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));
        touchCollections(homestay);
        return homestay;
    }

    @Transactional(readOnly = true)
    public java.util.List<Homestay> getHomestaysByHost(Long hostId) {
        return homestayRepository.findAll().stream()
                .filter(h -> h.getHost().getId().equals(hostId))
                .peek(this::touchCollections)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public Homestay createHomestay(Long hostId, Homestay homestayData) {
        com.homestay.homestay_backend.entity.User host = new com.homestay.homestay_backend.entity.User();
        host.setId(hostId);
        homestayData.setHost(host);
        if (homestayData.getStatus() == null) {
            homestayData.setStatus(com.homestay.homestay_backend.enums.HomestayStatusEnum.ACTIVE);
        }
        if (homestayData.getImages() != null) {
            homestayData.getImages().forEach(img -> img.setHomestay(homestayData));
        }
        homestayData.setAmenities(resolveAmenities(homestayData.getAmenities()));
        applyRefundRules(homestayData, homestayData.getRefundRules());
        Homestay saved = homestayRepository.save(homestayData);
        touchCollections(saved);
        return saved;
    }

    @Transactional
    public Homestay updateHomestay(Long hostId, Long homestayId, Homestay updated) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));
        if (!homestay.getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized: Not your homestay");
        }
        homestay.setTitle(updated.getTitle());
        homestay.setDescription(updated.getDescription());
        homestay.setAddress(updated.getAddress());
        homestay.setCity(updated.getCity());
        homestay.setPricePerNight(updated.getPricePerNight());
        homestay.setMaxGuests(updated.getMaxGuests());
        homestay.setBedrooms(updated.getBedrooms());
        homestay.setBeds(updated.getBeds());
        homestay.setBathrooms(updated.getBathrooms());
        homestay.setAmenities(resolveAmenities(updated.getAmenities()));

        if (updated.getImages() != null) {
            if (homestay.getImages() == null) {
                homestay.setImages(new ArrayList<>());
            }
            homestay.getImages().clear();
            updated.getImages().forEach(img -> {
                img.setHomestay(homestay);
                homestay.getImages().add(img);
            });
        }

        if (updated.getRefundRules() != null) {
            applyRefundRules(homestay, updated.getRefundRules());
        }

        Homestay saved = homestayRepository.save(homestay);
        touchCollections(saved);
        return saved;
    }

    private void applyRefundRules(Homestay homestay, List<HomestayRefundRule> incoming) {
        if (homestay.getRefundRules() == null) {
            homestay.setRefundRules(new ArrayList<>());
        }
        homestay.getRefundRules().clear();

        List<HomestayRefundRule> source = (incoming == null || incoming.isEmpty())
                ? defaultRefundRules()
                : incoming;

        for (HomestayRefundRule raw : source) {
            if (raw == null) continue;
            int hours = raw.getMinHoursBefore() != null ? raw.getMinHoursBefore() : 0;
            int percent = raw.getRefundPercent() != null ? raw.getRefundPercent() : 0;
            if (hours < 0) {
                throw new RuntimeException("Số giờ trước check-in không được âm");
            }
            if (percent < 0 || percent > 100) {
                throw new RuntimeException("Phần trăm hoàn tiền phải từ 0 đến 100");
            }
            HomestayRefundRule rule = HomestayRefundRule.builder()
                    .homestay(homestay)
                    .minHoursBefore(hours)
                    .refundPercent(percent)
                    .build();
            homestay.getRefundRules().add(rule);
        }

        if (homestay.getRefundRules().isEmpty()) {
            for (HomestayRefundRule d : defaultRefundRules()) {
                d.setHomestay(homestay);
                homestay.getRefundRules().add(d);
            }
        }
    }

    private void touchCollections(Homestay homestay) {
        if (homestay.getAmenities() != null) {
            homestay.getAmenities().size();
        }
        if (homestay.getImages() != null) {
            homestay.getImages().size();
        }
        if (homestay.getRefundRules() != null) {
            homestay.getRefundRules().size();
        }
    }

    private List<Amenity> resolveAmenities(List<Amenity> incoming) {
        if (incoming == null || incoming.isEmpty()) {
            return new ArrayList<>();
        }
        return incoming.stream()
                .filter(a -> a != null && a.getId() != null)
                .map(a -> amenityRepository.findById(a.getId())
                        .orElseThrow(() -> new RuntimeException("Amenity không tồn tại: " + a.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<com.homestay.homestay_backend.entity.Booking> getCalendarBookings(Long hostId, Long homestayId, int month, int year) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));
        if (!homestay.getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized: Not your homestay");
        }
        java.time.LocalDate startDate = java.time.LocalDate.of(year, month, 1);
        java.time.LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        return bookingRepository.findOccupyingBookings(homestayId, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<com.homestay.homestay_backend.entity.Booking> getBookingsByDate(Long hostId, Long homestayId, java.time.LocalDate date) {
        Homestay homestay = homestayRepository.findById(homestayId)
                .orElseThrow(() -> new RuntimeException("Homestay not found"));
        if (!homestay.getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized: Not your homestay");
        }
        return bookingRepository.findOccupyingBookings(homestayId, date, date);
    }
}
