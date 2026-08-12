package com.homestay.homestay_backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "homestay_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomestayImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "homestay_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Homestay homestay;

    private String imageUrl;
    private Boolean isPrimary;
}
