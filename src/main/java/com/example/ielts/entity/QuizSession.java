package com.example.ielts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "quiz_sessions", schema = "app")
public class QuizSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "test_id", nullable = false)
    private UUID testId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // ACTIVE, COMPLETED

    @Column(name = "allowed_student_ids", columnDefinition = "TEXT")
    private String allowedStudentIds; // JSON array of UUIDs

    @CreationTimestamp
    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }

    public UUID getTestId() { return testId; }
    public void setTestId(UUID testId) { this.testId = testId; }

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAllowedStudentIds() { return allowedStudentIds; }
    public void setAllowedStudentIds(String allowedStudentIds) { this.allowedStudentIds = allowedStudentIds; }

    public LocalDateTime getStartedAt() { return startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
