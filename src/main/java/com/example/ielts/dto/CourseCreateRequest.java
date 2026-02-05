package com.example.ielts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class CourseCreateRequest {

    @NotBlank
    @Size(max = 100)
    public String title;

    @Size(max = 30)
    public String level;

    @Positive
    public Integer durationWeeks;
}
