package com.example.ielts.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class CourseResponse {
    public UUID courseId;
    public String title;
    public String level;
    public Integer durationWeeks;
    public LocalDateTime createdAt;
}
