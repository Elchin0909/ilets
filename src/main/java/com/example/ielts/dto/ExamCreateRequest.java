package com.example.ielts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public class ExamCreateRequest {
    @NotNull public UUID groupId;
    @NotBlank public String title;
    @NotNull public LocalDate examDate;
}
