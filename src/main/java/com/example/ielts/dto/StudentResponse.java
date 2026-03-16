package com.example.ielts.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class StudentResponse {
    public UUID studentId;
    public String fullName;
    public String email;
    public String phone;
    public LocalDate birthDate;
    public LocalDateTime createdAt;
    public String avatarUrl;
    public Double ieltsBandScore;
    public Double targetBandScore;
    public boolean hasAccount;
    public String username;
}
