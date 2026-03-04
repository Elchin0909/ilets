package com.example.ielts.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class QuizTestResponse {
    public UUID testId;
    public String title;
    public String level;
    public String createdByRole;
    public UUID teacherId;
    public String teacherName;
    public boolean approved;
    public LocalDateTime createdAt;
    public long questionCount;
}
