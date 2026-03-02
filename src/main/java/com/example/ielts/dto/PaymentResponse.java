package com.example.ielts.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class PaymentResponse {
    public UUID paymentId;
    public UUID studentId;
    public String studentName;
    public BigDecimal amount;
    public String currency;
    public String type;
    public String month;
    public String notes;
    public LocalDate paidAt;
    public LocalDateTime createdAt;
}
