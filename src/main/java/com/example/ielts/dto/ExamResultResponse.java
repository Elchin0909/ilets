package com.example.ielts.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ExamResultResponse {
    public UUID examId;
    public UUID studentId;
    public BigDecimal listening;
    public BigDecimal reading;
    public BigDecimal writing;
    public BigDecimal speaking;
    public BigDecimal overall;
    public String comment;
    public LocalDateTime createdAt;
}
