package com.homestay.homestay_backend.service;

import com.homestay.homestay_backend.entity.Homestay;
import com.homestay.homestay_backend.repository.BookingRepository;
import com.homestay.homestay_backend.repository.HomestayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HomestayService {
    private final HomestayRepository homestayRepository;
    private final BookingRepository bookingRepository;

    // Business Rule 4: Host không được xóa Homestay đang có đơn PENDING/CONFIRM
    @Transactional
    public void deleteHomestay(Long hostId, Long homestayId) {
        Homestay homestay = homestayRepository.findById(homestayId).orElseThrow();
        if (!homestay.getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized");
        }

        long activeBookings = bookingRepository.countActiveBookings(homestayId);
        if (activeBookings > 0) {
            throw new RuntimeException("Cannot delete homestay with PENDING/CONFIRM bookings");
        }
        homestayRepository.delete(homestay);
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
    
    public Homestay getHomestayById(Long id) {
        return homestayRepository.findById(id).orElseThrow(() -> new RuntimeException("Homestay not found"));
    }

    public java.util.List<Homestay> getHomestaysByHost(Long hostId) {
        return homestayRepository.findAll().stream()
                .filter(h -> h.getHost().getId().equals(hostId))
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
        return homestayRepository.save(homestayData);
    }

    @Transactional
    public Homestay updateHomestay(Long hostId, Long homestayId, Homestay updated) {
        Homestay homestay = homestayRepository.findById(homestayId).orElseThrow(() -> new RuntimeException("Homestay not found"));
        if (!homestay.getHost().getId().equals(hostId)) {
            throw new RuntimeException("Unauthorized: Not your homestay");
        }
        homestay.setTitle(updated.getTitle());
        homestay.setDescription(updated.getDescription());
        homestay.setAddress(updated.getAddress());
        homestay.setCity(updated.getCity());
        homestay.setPricePerNight(updated.getPricePerNight());
        homestay.setMaxGuests(updated.getMaxGuests());
        // Handle images update (simplified for now: just clear and add new)
        if (updated.getImages() != null) {
            homestay.getImages().clear();
            updated.getImages().forEach(img -> {
                img.setHomestay(homestay);
                homestay.getImages().add(img);
            });
        }
        return homestayRepository.save(homestay);
    }
}
