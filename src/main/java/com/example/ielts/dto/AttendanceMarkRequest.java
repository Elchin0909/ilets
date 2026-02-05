package com.example.ielts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class AttendanceMarkRequest {

    @NotNull
    public UUID lessonId;

    @NotNull
    public UUID studentId;

    @NotBlank
    public String status; // present | absent | late

    public String comment;
}
