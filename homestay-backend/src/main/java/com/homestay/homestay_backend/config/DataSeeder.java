package com.homestay.homestay_backend.config;

import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.entity.Homestay;
import com.homestay.homestay_backend.entity.HomestayImage;
import com.homestay.homestay_backend.entity.Amenity;
import com.homestay.homestay_backend.enums.RoleEnum;
import com.homestay.homestay_backend.enums.HomestayStatusEnum;
import com.homestay.homestay_backend.repository.UserRepository;
import com.homestay.homestay_backend.repository.HomestayRepository;
import com.homestay.homestay_backend.repository.AmenityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.ArrayList;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private HomestayRepository homestayRepository;

    @Autowired
    private AmenityRepository amenityRepository;

    @Override
    public void run(String... args) throws Exception {
        seedAmenities();

        // Create default ADMIN
        if (!userRepository.existsByEmail("admin@gmail.com")) {
            User admin = new User();
            admin.setEmail("admin@gmail.com");
            admin.setPassword("admin123");
            admin.setFullName("Quản Trị Viên");
            admin.setPhone("0999999999");
            admin.setRole(RoleEnum.ADMIN);
            userRepository.save(admin);
            System.out.println("Created default ADMIN: admin@gmail.com / admin123");
        }

        // Create default HOST
        if (!userRepository.existsByEmail("host@gmail.com")) {
            User host = new User();
            host.setEmail("host@gmail.com");
            host.setPassword("host123");
            host.setFullName("Chủ Nhà Demo");
            host.setPhone("0888888888");
            host.setRole(RoleEnum.HOST);
            userRepository.save(host);
            System.out.println("Created default HOST: host@gmail.com / host123");
        }

        // Create sample Homestays for HOST
        User savedHost = userRepository.findByEmail("host@gmail.com").orElse(null);
        if (savedHost != null && homestayRepository.count() == 0) {
            Homestay h1 = new Homestay();
            h1.setHost(savedHost);
            h1.setTitle("Villa Đà Lạt View Rừng Thông");
            h1.setDescription("Một căn villa tuyệt đẹp nằm giữa rừng thông Đà Lạt, phù hợp cho gia đình hoặc nhóm bạn.");
            h1.setAddress("123 Trần Hưng Đạo, Phường 10");
            h1.setCity("Đà Lạt");
            h1.setPricePerNight(new BigDecimal("1500000.0"));
            h1.setMaxGuests(6);
            h1.setBedrooms(3);
            h1.setBeds(4);
            h1.setBathrooms(2);
            h1.setStatus(HomestayStatusEnum.ACTIVE);
            h1.setAverageRating(4.8);
            
            HomestayImage img1 = new HomestayImage();
            img1.setHomestay(h1);
            img1.setImageUrl("https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1000&auto=format&fit=crop");
            img1.setIsPrimary(true);
            
            List<HomestayImage> images1 = new ArrayList<>();
            images1.add(img1);
            h1.setImages(images1);
            
            homestayRepository.save(h1);

            Homestay h2 = new Homestay();
            h2.setHost(savedHost);
            h2.setTitle("Homestay Vũng Tàu Gần Biển");
            h2.setDescription("Chỉ cách biển 5 phút đi bộ, đầy đủ tiện nghi, nướng BBQ ngoài trời.");
            h2.setAddress("45 Thùy Vân, Phường 2");
            h2.setCity("Vũng Tàu");
            h2.setPricePerNight(new BigDecimal("800000.0"));
            h2.setMaxGuests(4);
            h2.setBedrooms(2);
            h2.setBeds(3);
            h2.setBathrooms(1);
            h2.setStatus(HomestayStatusEnum.ACTIVE);
            h2.setAverageRating(4.5);
            
            HomestayImage img2 = new HomestayImage();
            img2.setHomestay(h2);
            img2.setImageUrl("https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=1000&auto=format&fit=crop");
            img2.setIsPrimary(true);
            
            List<HomestayImage> images2 = new ArrayList<>();
            images2.add(img2);
            h2.setImages(images2);
            
            homestayRepository.save(h2);

            Homestay h3 = new Homestay();
            h3.setHost(savedHost);
            h3.setTitle("Căn Hộ Cao Cấp Quận 1");
            h3.setDescription("Ngay trung tâm Sài Gòn, view landmark 81 siêu đẹp.");
            h3.setAddress("Vinhome Đồng Khởi, Quận 1");
            h3.setCity("Hồ Chí Minh");
            h3.setPricePerNight(new BigDecimal("1200000.0"));
            h3.setMaxGuests(2);
            h3.setBedrooms(1);
            h3.setBeds(1);
            h3.setBathrooms(1);
            h3.setStatus(HomestayStatusEnum.ACTIVE);
            h3.setAverageRating(5.0);
            
            HomestayImage img3 = new HomestayImage();
            img3.setHomestay(h3);
            img3.setImageUrl("https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000&auto=format&fit=crop");
            img3.setIsPrimary(true);
            
            List<HomestayImage> images3 = new ArrayList<>();
            images3.add(img3);
            h3.setImages(images3);
            
            homestayRepository.save(h3);

            System.out.println("Created 3 sample homestays for host@gmail.com");
        }
    }

    private void seedAmenities() {
        String[][] defaults = {
                {"Wifi tốc độ cao", "wifi"},
                {"Bãi đỗ xe miễn phí", "car"},
                {"Bếp đủ dụng cụ", "utensils"},
                {"Smart TV", "tv"},
                {"Máy lạnh", "wind"},
                {"Máy giặt", "washing-machine"},
                {"Hồ bơi", "waves"},
                {"Ban công / sân thượng", "home"},
                {"Lò sưởi", "flame"},
                {"Không hút thuốc", "ban"}
        };
        for (String[] item : defaults) {
            if (!amenityRepository.existsByName(item[0])) {
                amenityRepository.save(Amenity.builder()
                        .name(item[0])
                        .icon(item[1])
                        .build());
            }
        }
    }
}
