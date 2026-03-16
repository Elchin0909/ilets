package com.example.ielts.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "teacher_ratings", schema = "app",
       uniqueConstraints = @UniqueConstraint(columnNames = {"teacher_id", "student_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeacherRating {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "rating_id")
    private UUID ratingId;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "rating", nullable = false)
    private Integer rating; // 1-5

    @Column(name = "comment", length = 500)
    private String comment;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void pre() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
