package com.example.ielts.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications", schema = "app")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notification_id")
    private UUID notificationId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "message", length = 1000)
    private String message;

    @Column(name = "type", length = 50)
    private String type; // INFO, WARNING, SUCCESS, HOMEWORK, EXAM, PAYMENT

    @Column(name = "is_read")
    private boolean read;

    @Column(name = "link", length = 500)
    private String link;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void pre() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
