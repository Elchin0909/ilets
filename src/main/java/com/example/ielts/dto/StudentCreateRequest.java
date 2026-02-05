package com.example.ielts.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class StudentCreateRequest {

    @NotBlank
    @Size(max = 180)
    public String fullName;

    @Email
    @Size(max = 120)
    public String email;

    @Size(max = 30)
    public String phone;

    public LocalDate birthDate;
}
