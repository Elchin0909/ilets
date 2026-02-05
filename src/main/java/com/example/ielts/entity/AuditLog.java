package com.example.ielts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs", schema = "app")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "audit_id", nullable = false)
    private UUID auditId;

    @Column(name = "username", nullable = false, length = 255)
    private String username;

    @Column(name = "role", nullable = false, length = 50)
    private String role;

    @Column(name = "action", nullable = false, length = 255)
    private String action;

    @Column(name = "entity_id")
    private UUID entityId; // ✅ DB’da uuid

    @Column(name = "entity_type", length = 60)
    private String entityType;

    @Column(name = "ip", length = 255)
    private String ip;

    @Column(name = "user_agent", length = 200)
    private String userAgent;

    @Column(name = "details", length = 500)
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // getters/setters
    public UUID getAuditId() { return auditId; }
    public void setAuditId(UUID auditId) { this.auditId = auditId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
