package com.example.ielts.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final String issuer;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.issuer:ielts-centre}") String issuer,
            @Value("${app.jwt.secret-base64:false}") boolean secretBase64
    ) {
        String s = (secret == null) ? "" : secret.trim();
        if (s.isEmpty()) {
            throw new IllegalStateException("app.jwt.secret is empty");
        }

        // ✅ HS256 uchun kamida 32+ char tavsiya
        // Base64 bo'lsa decoded byte uzunligi yetarli bo'lishi kerak.
        byte[] keyBytes = secretBase64
                ? Decoders.BASE64.decode(s)
                : s.getBytes(StandardCharsets.UTF_8);

        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.issuer = issuer;
    }

    /** ✅ Access token yaratish (subject = username) */
    public String createAccessToken(UUID userId, String username, Duration ttl) {
        Instant now = Instant.now();
        Instant exp = now.plus(ttl);

        return Jwts.builder()
                .issuer(issuer)
                .subject(username)
                .claim("uid", userId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /** ✅ Token ichidan username */
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /** ✅ Token ichidan userId */
    public UUID extractUserId(String token) {
        Object uid = parseClaims(token).get("uid");
        return (uid == null) ? null : UUID.fromString(uid.toString());
    }

    /** ✅ Token qolgan umrini hisoblash (blacklist TTL uchun) */
    public Duration remainingTtl(String token) {
        try {
            Date exp = parseClaims(token).getExpiration();
            if (exp == null) return Duration.ZERO;

            Duration left = Duration.between(Instant.now(), exp.toInstant());
            return left.isNegative() ? Duration.ZERO : left;
        } catch (Exception e) {
            return Duration.ZERO;
        }
    }

    /** ✅ Validatsiya */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        // ✅ JJWT 0.12.x
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer) // xohlamasang olib tashlasa ham bo'ladi
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
