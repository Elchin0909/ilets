package com.example.ielts.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class EnrollmentResponse {
    public UUID enrollmentId;
    public UUID groupId;
    public UUID studentId;
    public LocalDateTime enrolledAt;
    public String status;
}
