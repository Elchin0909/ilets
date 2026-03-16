package com.example.ielts.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "homework_submissions", schema = "app",
        uniqueConstraints = @UniqueConstraint(columnNames = {"homework_id", "student_id"}))
public class HomeworkSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "submission_id", nullable = false)
    private UUID submissionId;

    @Column(name = "homework_id", nullable = false)
    private UUID homeworkId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    /** Ustoz bahosi: 1-10 */
    private Integer grade;

    @Column(length = 500)
    private String feedback;

    /** SUBMITTED, GRADED */
    @Column(nullable = false, length = 15)
    private String status = "SUBMITTED";

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;
}
