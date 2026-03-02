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
@Table(name = "writing_logs", schema = "app")
public class WritingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "log_id", nullable = false)
    private UUID logId;

    /** Nullable — teacher/admin tekshirganida null bo'lishi mumkin */
    @Column(name = "student_id")
    private UUID studentId;

    @Column(name = "student_name", length = 200)
    private String studentName;

    /** "task1" yoki "task2" */
    @Column(name = "task_type", length = 10)
    private String taskType;

    /** Beginner | Elementary | Pre-IELTS | IELTS Ready | Advanced */
    @Column(length = 20)
    private String level;

    /** "5.0–5.5" */
    @Column(name = "band_range", length = 10)
    private String bandRange;

    /** Matnning birinchi 300 ta belgisi */
    @Column(name = "text_snippet", length = 300)
    private String textSnippet;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
