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
@Table(name = "support_messages", schema = "app")
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    /** STUDENT yoki STAFF */
    @Column(name = "sender_role", nullable = false, length = 20)
    private String senderRole;

    @Column(name = "sender_name", length = 200)
    private String senderName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
