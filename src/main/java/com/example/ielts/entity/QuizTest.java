package com.example.ielts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "quiz_tests", schema = "app")
public class QuizTest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "test_id", nullable = false)
    private UUID testId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "level", nullable = false, length = 30)
    private String level; // BEGINNER, ELEMENTARY, PRE_IELTS, IELTS_READY, ADVANCED

    @Column(name = "created_by_role", length = 20)
    private String createdByRole; // ADMIN, TEACHER

    @Column(name = "teacher_id")
    private UUID teacherId;

    @Column(name = "approved", nullable = false)
    private boolean approved = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public UUID getTestId() { return testId; }
    public void setTestId(UUID testId) { this.testId = testId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getCreatedByRole() { return createdByRole; }
    public void setCreatedByRole(String createdByRole) { this.createdByRole = createdByRole; }

    public UUID getTeacherId() { return teacherId; }
    public void setTeacherId(UUID teacherId) { this.teacherId = teacherId; }

    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
