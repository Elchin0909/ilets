package com.example.ielts.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class AdminOtpVerifyRequest {
    @NotBlank
    public String username;

    @NotBlank
    public String code;
}
