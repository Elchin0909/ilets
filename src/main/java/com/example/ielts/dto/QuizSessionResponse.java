package com.example.ielts.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class QuizSessionResponse {
    public UUID sessionId;
    public UUID testId;
    public String testTitle;
    public String testLevel;
    public UUID groupId;
    public String status;
    public LocalDateTime startedAt;
    public LocalDateTime completedAt;
    public List<QuizQuestionDto> questions; // populated when student takes the quiz
    public boolean alreadySubmitted;
}
