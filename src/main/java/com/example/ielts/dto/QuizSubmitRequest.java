package com.example.ielts.dto;

import java.util.List;
import java.util.UUID;

public class QuizSubmitRequest {
    public List<AnswerItem> answers;

    public static class AnswerItem {
        public UUID questionId;
        public String selectedOption; // A, B, C, D
    }
}
