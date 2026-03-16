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
@Table(name = "support_tickets", schema = "app")
public class SupportTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "ticket_id", nullable = false)
    private UUID ticketId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "student_name", length = 200)
    private String studentName;

    @Column(nullable = false, length = 300)
    private String subject;

    /** OPEN, ANSWERED, CLOSED */
    @Column(nullable = false, length = 20)
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
