package com.homestay.homestay_backend.dto;

import com.homestay.homestay_backend.entity.User;
import com.homestay.homestay_backend.enums.RoleEnum;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponseDto {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String avatar;
    private RoleEnum role;
    private String bankName;
    private String bankHolder;
    private String bankAccount;
    private boolean hasBankAccount;

    public static UserResponseDto from(User user) {
        boolean hasBank = user.getBankAccount() != null && !user.getBankAccount().isBlank()
                && user.getBankName() != null && !user.getBankName().isBlank()
                && user.getBankHolder() != null && !user.getBankHolder().isBlank();
        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .bankName(user.getBankName())
                .bankHolder(user.getBankHolder())
                .bankAccount(user.getBankAccount())
                .hasBankAccount(hasBank)
                .build();
    }
}
