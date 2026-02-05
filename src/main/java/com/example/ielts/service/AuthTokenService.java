package com.example.ielts.service;

import com.example.ielts.dto.auth.AuthResponse;
import com.example.ielts.entity.RefreshToken;
import com.example.ielts.repo.RefreshTokenRepository;
import com.example.ielts.repo.UserRepository;
import com.example.ielts.security.TokenBlacklistService;
import com.example.ielts.security.TokenHash;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthTokenService {

    private final RefreshTokenRepository refreshRepo;
    private final TokenBlacklistService blacklist;
    private final JwtService jwtService;
    private final UserRepository userRepo;

    public AuthTokenService(RefreshTokenRepository refreshRepo,
                            TokenBlacklistService blacklist,
                            JwtService jwtService,
                            UserRepository userRepo) {
        this.refreshRepo = refreshRepo;
        this.blacklist = blacklist;
        this.jwtService = jwtService;
        this.userRepo = userRepo;
    }

    private static final Duration REFRESH_TTL = Duration.ofDays(30);
    private static final Duration ACCESS_TTL = Duration.ofMinutes(15);

    @Transactional
    public AuthResponse refresh(String refreshTokenRaw) {

        String hash = TokenHash.sha256(refreshTokenRaw);

        RefreshToken token = refreshRepo.findByTokenHash(hash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (token.isRevoked()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token revoked");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        UUID userId = token.getUserId();

        // rotate: eski refresh revoke
        refreshRepo.revokeByTokenHash(hash, LocalDateTime.now());

        // yangi refresh yarat
        String newRefreshRaw = UUID.randomUUID() + "." + UUID.randomUUID();
        String newHash = TokenHash.sha256(newRefreshRaw);

        RefreshToken newToken = new RefreshToken();
        newToken.setUserId(userId);
        newToken.setTokenHash(newHash);
        newToken.setExpiresAt(LocalDateTime.now().plus(REFRESH_TTL));
        refreshRepo.save(newToken);

        // ✅ username topamiz (token subject uchun kerak)
        String username = userRepo.findById(userId)
                .map(u -> u.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        // ✅ access token yaratish (3ta param)
        String newAccess = jwtService.createAccessToken(userId, username, ACCESS_TTL);

        return new AuthResponse(newAccess, newRefreshRaw);
    }

    @Transactional
    public void logout(String refreshTokenRaw, String accessTokenRawOrNull) {

        String hash = TokenHash.sha256(refreshTokenRaw);
        refreshRepo.revokeByTokenHash(hash, LocalDateTime.now());

        if (accessTokenRawOrNull != null && !accessTokenRawOrNull.isBlank()) {
            Duration ttl = jwtService.remainingTtl(accessTokenRawOrNull);
            if (!ttl.isNegative() && !ttl.isZero()) {
                blacklist.blacklist(TokenHash.sha256(accessTokenRawOrNull), ttl);
            }
        }
    }
}
