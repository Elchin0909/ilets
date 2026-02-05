package com.example.ielts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public class GroupCreateRequest {

    @NotNull
    public UUID courseId;

    @NotNull
    public UUID teacherId;

    @NotBlank
    public String groupName;

    @NotNull
    public LocalDate startDate;

    public LocalDate endDate;

    public String schedule;
}
