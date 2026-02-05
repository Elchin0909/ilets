package com.example.ielts.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class EnrollmentCreateRequest {
    @NotNull
    public UUID studentId;
@NotNull
public UUID groupId;
    public String status; // optional; default "active"
}
