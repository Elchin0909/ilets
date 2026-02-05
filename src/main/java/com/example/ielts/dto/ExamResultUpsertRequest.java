package com.example.ielts.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class ExamResultUpsertRequest {
    public UUID studentId;
    public BigDecimal listening;
    public BigDecimal reading;
    public BigDecimal writing;
    public BigDecimal speaking;
    public String comment;
}
