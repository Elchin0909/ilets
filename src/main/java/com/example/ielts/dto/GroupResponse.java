package com.example.ielts.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class GroupResponse {

    public UUID groupId;
    public UUID courseId;
    public UUID teacherId;
    public String teacherName;   // e.g. "Ali Valiyev"
    public String courseName;    // e.g. "Pre-IELTS"
    public String groupName;
    public LocalDate startDate;
    public LocalDate endDate;
    public String schedule;
    public LocalDateTime createdAt;
}
