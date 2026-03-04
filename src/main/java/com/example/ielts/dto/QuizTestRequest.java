package com.example.ielts.dto;

import java.util.List;

public class QuizTestRequest {
    public String title;
    public String level; // BEGINNER, ELEMENTARY, PRE_IELTS, IELTS_READY, ADVANCED
    public List<QuestionItem> questions;

    public static class QuestionItem {
        public String text;
        public String optionA;
        public String optionB;
        public String optionC;
        public String optionD;
        public String correct; // A, B, C, D
    }
}
