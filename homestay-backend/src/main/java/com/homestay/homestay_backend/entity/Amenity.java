package com.homestay.homestay_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "amenities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Amenity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String icon;

    @ManyToMany(mappedBy = "amenities")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Homestay> homestays;
}
