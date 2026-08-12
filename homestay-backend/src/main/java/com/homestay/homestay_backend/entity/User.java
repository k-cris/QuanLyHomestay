package com.homestay.homestay_backend.entity;

import com.homestay.homestay_backend.enums.RoleEnum;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String fullName;
    private String phone;
    private String avatar;

    @Enumerated(EnumType.STRING)
    private RoleEnum role;

    private String bankName;
    private String bankHolder;
    private String bankAccount;

    @OneToMany(mappedBy = "user")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<HostRequest> hostRequests;

    @OneToMany(mappedBy = "host")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Homestay> homestays;

    @OneToMany(mappedBy = "guest")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Booking> bookings;
}
