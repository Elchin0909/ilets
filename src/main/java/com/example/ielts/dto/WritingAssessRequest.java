package com.example.ielts.dto;

import java.util.UUID;

public class WritingAssessRequest {
    public String text;
    public String taskType;  // "task1" | "task2"
    public UUID studentId;   // optional — kimning yozmasini tekshirayotgani
}
