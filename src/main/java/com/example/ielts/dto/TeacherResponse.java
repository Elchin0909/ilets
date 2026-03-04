package com.example.ielts.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class TeacherResponse {
    public UUID teacherId;
    public String fullName;
    public String phone;
    public String email;
    public LocalDate birthDate;
    public LocalDateTime createdAt;
    public String username;
    public String avatarUrl;
}
