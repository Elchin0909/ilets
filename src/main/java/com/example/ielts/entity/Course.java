package com.example.ielts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "courses", schema = "app")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(name = "title", nullable = false, unique = true, length = 100)
    private String title;

    @Column(name = "level", length = 30)
    private String level;

    @Column(name = "duration_weeks")
    private Integer durationWeeks;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // getters/setters
    public UUID getCourseId() { return courseId; }
    public void setCourseId(UUID courseId) { this.courseId = courseId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public Integer getDurationWeeks() { return durationWeeks; }
    public void setDurationWeeks(Integer durationWeeks) { this.durationWeeks = durationWeeks; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
