package com.example.ielts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "enrollments",
        schema = "app",
        uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "student_id"})
)
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "enrollment_id", nullable = false)
    private UUID enrollmentId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @CreationTimestamp
    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private LocalDateTime enrolledAt;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    // getters/setters
    public UUID getEnrollmentId() { return enrollmentId; }
    public void setEnrollmentId(UUID enrollmentId) { this.enrollmentId = enrollmentId; }

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public LocalDateTime getEnrolledAt() { return enrolledAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }
}
