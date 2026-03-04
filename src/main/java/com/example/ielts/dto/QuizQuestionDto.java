package com.example.ielts.dto;

import java.util.UUID;

public class QuizQuestionDto {
    public UUID questionId;
    public String questionText;
    public String optionA;
    public String optionB;
    public String optionC;
    public String optionD;
    public int orderIndex;
    // correctOption is NOT included for student view (security)
    // It IS included in admin view
    public String correctOption; // null for student-facing endpoints
}
