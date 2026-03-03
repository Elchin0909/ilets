package com.example.ielts.dto;

import java.time.LocalDate;
import java.util.UUID;

public class AttendanceResponse {
    public UUID lessonId;
    public UUID studentId;
    public String fullName;
    public String status;
    public String comment;
    public LocalDate lessonDate;
}
