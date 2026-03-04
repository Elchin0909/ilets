package com.example.ielts.dto;

import java.util.List;
import java.util.UUID;

public class QuizSessionRequest {
    public UUID testId;
    public UUID groupId;
    public List<UUID> allowedStudentIds; // students marked present
}
