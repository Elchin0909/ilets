package com.example.ielts.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminResetPasswordRequest {
    @NotBlank
    public String username;

    @NotBlank
    public String code;

    @NotBlank
    @Size(min = 6, max = 80)
    public String newPassword;
}
