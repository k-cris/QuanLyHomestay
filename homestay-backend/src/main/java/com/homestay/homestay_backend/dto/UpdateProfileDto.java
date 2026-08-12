package com.homestay.homestay_backend.dto;

import lombok.Data;

@Data
public class UpdateProfileDto {
    private String fullName;
    private String phone;
    private String avatar;
    private String bankName;
    private String bankHolder;
    private String bankAccount;
    private String currentPassword;
    private String password;
    private String confirmPassword;
}
