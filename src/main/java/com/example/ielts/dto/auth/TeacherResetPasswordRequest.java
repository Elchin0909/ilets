package com.example.ielts.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class TeacherResetPasswordRequest {
    @NotNull
    public UUID teacherId;

    @NotBlank
    @Size(min = 4, max = 80)
    public String newPassword;
}
