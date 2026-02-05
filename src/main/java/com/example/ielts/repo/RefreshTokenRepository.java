package com.example.ielts.repo;

import com.example.ielts.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
        update RefreshToken t
        set t.revokedAt = :now
        where t.userId = :userId
          and t.revokedAt is null
    """)
    int revokeAllByUserId(UUID userId, LocalDateTime now);

    @Modifying
    @Query("""
        update RefreshToken t
        set t.revokedAt = :now
        where t.tokenHash = :tokenHash
          and t.revokedAt is null
    """)
    int revokeByTokenHash(String tokenHash, LocalDateTime now);

    @Modifying
    @Query("""
        delete from RefreshToken t
        where t.expiresAt < :now
    """)
    int deleteExpired(LocalDateTime now);
}
