package com.example.ielts.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class QuizResultResponse {
    public UUID resultId;
    public UUID sessionId;
    public UUID studentId;
    public String studentName;
    public int totalQuestions;
    public int correctAnswers;
    public BigDecimal score;
    public LocalDateTime submittedAt;
}
