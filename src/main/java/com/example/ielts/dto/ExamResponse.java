package com.example.ielts.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class ExamResponse {
    public UUID examId;
    public UUID groupId;
    public String title;
    public LocalDate examDate;
    public LocalDateTime createdAt;
}
