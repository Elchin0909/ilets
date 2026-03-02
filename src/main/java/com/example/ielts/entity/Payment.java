package com.example.ielts.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "payments", schema = "app")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "payment_id", nullable = false)
    private UUID paymentId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(length = 10)
    private String currency = "UZS";

    /** MONTHLY | REGISTRATION | OTHER */
    @Column(length = 20, nullable = false)
    private String type = "MONTHLY";

    /** ISO month: "2026-03" — used for MONTHLY payments */
    @Column(length = 7)
    private String month;

    @Column(length = 300)
    private String notes;

    @Column(name = "paid_at")
    private LocalDate paidAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
