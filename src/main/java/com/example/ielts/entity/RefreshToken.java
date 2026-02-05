package com.example.ielts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens", schema = "app",
        indexes = {
                @Index(name = "idx_refresh_user", columnList = "user_id"),
                @Index(name = "idx_refresh_expires", columnList = "expires_at")
        })
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "token_id", nullable = false)
    private UUID tokenId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // refresh token'ni DB'da plain saqlamaymiz
    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "user_agent", length = 200)
    private String userAgent;

    @Column(name = "ip", length = 60)
    private String ip;

    // getters/setters
    public UUID getTokenId() { return tokenId; }
    public void setTokenId(UUID tokenId) { this.tokenId = tokenId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }

    public boolean isRevoked() { return revokedAt != null; }
}
