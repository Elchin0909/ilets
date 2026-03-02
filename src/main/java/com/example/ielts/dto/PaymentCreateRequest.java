package com.example.ielts.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class PaymentCreateRequest {
    public UUID studentId;
    public BigDecimal amount;
    public String currency = "UZS";
    public String type = "MONTHLY";   // MONTHLY | REGISTRATION | OTHER
    public String month;              // "2026-03"
    public String notes;
    public LocalDate paidAt;
}
