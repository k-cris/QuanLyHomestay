package com.homestay.homestay_backend.entity;

import com.homestay.homestay_backend.enums.HomestayStatusEnum;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "homestays")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Homestay {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "host_id")
    private User host;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String address;
    private String city;
    
    private BigDecimal pricePerNight;
    private Integer maxGuests;

    @Enumerated(EnumType.STRING)
    private HomestayStatusEnum status;

    private Double averageRating;
    private Double latitude;
    private Double longitude;

    @OneToMany(mappedBy = "homestay", cascade = CascadeType.ALL)
    private List<HomestayImage> images;

    @ManyToMany
    @JoinTable(
        name = "homestay_amenities",
        joinColumns = @JoinColumn(name = "homestay_id"),
        inverseJoinColumns = @JoinColumn(name = "amenity_id")
    )
    private List<Amenity> amenities;

    @OneToMany(mappedBy = "homestay")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Booking> bookings;
}
