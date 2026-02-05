package com.example.ielts.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class AdminOtpRequest {
    @NotBlank
    public String username;
}
