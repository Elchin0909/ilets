package com.example.ielts.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "homework", schema = "app")
public class Homework {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "homework_id", nullable = false)
    private UUID homeworkId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "teacher_id")
    private UUID teacherId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date")
    private LocalDate dueDate;

    /** OPEN, CLOSED */
    @Column(nullable = false, length = 10)
    private String status = "OPEN";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
