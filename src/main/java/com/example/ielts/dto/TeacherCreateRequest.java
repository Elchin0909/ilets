package com.example.ielts.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class TeacherCreateRequest {

    @NotBlank
    @Size(max = 180)
    public String fullName;

    @Size(max = 30)
    public String phone;

    @Email
    @Size(max = 160)
    public String email;

    public LocalDate birthDate;

    @NotBlank
    @Size(max = 80)
    public String username;

    @NotBlank
    @Size(min = 4, max = 80)
    public String password;
}
