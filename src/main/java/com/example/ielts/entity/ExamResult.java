package com.example.ielts.entity;

import jakarta.persistence.*;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "exam_results", schema = "app")
@IdClass(ExamResultId.class)
public class ExamResult {

    @Id
    @Column(name = "exam_id")
    private UUID examId;

    @Id
    @Column(name = "student_id")
    private UUID studentId;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal listening;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal reading;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal writing;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal speaking;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal overall;

    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
