package com.example.ielts.service;

import com.example.ielts.dto.LoginRequest;
import com.example.ielts.dto.LoginResponse;
import com.example.ielts.dto.auth.AuthResponse;
import com.example.ielts.entity.RefreshToken;
import com.example.ielts.entity.User;
import com.example.ielts.repo.RefreshTokenRepository;
import com.example.ielts.repo.UserRepository;
import com.example.ielts.security.TokenHash;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final RefreshTokenRepository refreshRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    private static final Duration ACCESS_TTL = Duration.ofMinutes(15);
    private static final Duration REFRESH_TTL = Duration.ofDays(30);

    // ✅ eski endpoint uchun (token + role)
    public LoginResponse login(LoginRequest req) {
        var u = authenticate(req);

        String access = jwt.createAccessToken(u.getUserId(), u.getUsername(), ACCESS_TTL);
        if (access == null || access.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "JWT token is null/blank");
        }

        return new LoginResponse(access, u.getRole());
    }

    // ✅ token generate
    public AuthResponse issueTokens(User u) {

        String access = jwt.createAccessToken(u.getUserId(), u.getUsername(), ACCESS_TTL);
        if (access == null || access.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "JWT token is null/blank");
        }

        String refreshRaw = UUID.randomUUID() + "." + UUID.randomUUID();
        String refreshHash = TokenHash.sha256(refreshRaw);

        RefreshToken rt = new RefreshToken();
        rt.setUserId(u.getUserId());
        rt.setTokenHash(refreshHash);
        rt.setExpiresAt(LocalDateTime.now().plus(REFRESH_TTL));
        refreshRepo.save(rt);

        return new AuthResponse(access, refreshRaw);
    }

    // =======================
    // shared auth logic
    // =======================
    public User authenticate(LoginRequest req) {
        if (req == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is null");

        String uname = req.username == null ? "" : req.username.trim();
        String pass = req.password == null ? "" : req.password;

        var u = userRepo.findByUsername(uname).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bad credentials")
        );

        if (!u.isActive()) {
            if ("STUDENT".equals(u.getRole())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hisobingiz hali tasdiqlanmagan. Admin bilan bog'laning.");
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User inactive");
        }

        boolean match = encoder.matches(pass, u.getPasswordHash());
        if (!match) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bad credentials");
        }

        return u;
    }

    public User requireAdminByUsername(String username) {
        var u = userRepo.findByUsername(username).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bad credentials")
        );
        if (!"ADMIN".equalsIgnoreCase(u.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
        return u;
    }

    public void updatePassword(User u, String newPassword) {
        u.setPasswordHash(encoder.encode(newPassword));
        userRepo.save(u);
    }
}
