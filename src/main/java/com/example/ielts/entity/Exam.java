package com.example.ielts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exams", schema = "app")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public UUID getExamId() { return examId; }
    public void setExamId(UUID examId) { this.examId = examId; }

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
