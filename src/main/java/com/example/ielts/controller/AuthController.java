package com.example.ielts.controller;

import com.example.ielts.dto.LoginRequest;
import com.example.ielts.dto.LoginResponse;
import com.example.ielts.dto.auth.AuthResponse;
import com.example.ielts.dto.auth.LogoutRequest;
import com.example.ielts.dto.auth.RefreshRequest;
import com.example.ielts.dto.auth.AdminOtpRequest;
import com.example.ielts.dto.auth.AdminOtpVerifyRequest;
import com.example.ielts.dto.auth.AdminResetPasswordRequest;
import com.example.ielts.dto.auth.TeacherResetPasswordRequest;
import com.example.ielts.security.UserPrincipal;
import com.example.ielts.service.AuthService;
import com.example.ielts.service.AuthTokenService;
import com.example.ielts.service.AdminOtpService;
import com.example.ielts.repo.TeacherRepository;
import com.example.ielts.repo.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthTokenService authTokenService;
    private final AdminOtpService adminOtpService;
    private final TeacherRepository teacherRepo;
    private final UserRepository userRepo;

    // eski login: 1 ta token (access) + role
    @PostMapping("/login")
    public LoginResponse login(@RequestBody @Valid LoginRequest req) {
        return authService.login(req);
    }

    // yangi login: access + refresh
    @PostMapping("/login-v2")
    public ResponseEntity<?> loginV2(@RequestBody @Valid LoginRequest req) {
        var u = authService.authenticate(req);
        if ("ADMIN".equalsIgnoreCase(u.getRole())) {
            if (adminOtpService.isEnabled()) {
                adminOtpService.sendLoginOtp(u);
                return ResponseEntity.status(202).body(Map.of(
                        "otpRequired", true,
                        "username", u.getUsername()
                ));
            }
            return ResponseEntity.ok(authService.issueTokens(u));
        }
        return ResponseEntity.ok(authService.issueTokens(u));
    }

    @PostMapping("/admin/verify-otp")
    public AuthResponse verifyAdminOtp(@RequestBody @Valid AdminOtpVerifyRequest req) {
        var u = authService.requireAdminByUsername(req.username);
        boolean ok = adminOtpService.verifyLoginOtp(u.getUsername(), req.code);
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid code");
        }
        return authService.issueTokens(u);
    }

    @PostMapping("/admin/request-password-reset")
    public Map<String, Object> requestPasswordReset(@RequestBody @Valid AdminOtpRequest req) {
        var u = authService.requireAdminByUsername(req.username);
        adminOtpService.sendResetOtp(u);
        return Map.of("ok", true);
    }

    @PostMapping("/admin/reset-password")
    public Map<String, Object> resetPassword(@RequestBody @Valid AdminResetPasswordRequest req) {
        var u = authService.requireAdminByUsername(req.username);
        boolean ok = adminOtpService.verifyResetOtp(u.getUsername(), req.code);
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid code");
        }
        authService.updatePassword(u, req.newPassword);
        return Map.of("ok", true);
    }

    // ===== TEACHER reset (ADMIN only) =====
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/teacher/reset-password")
    public Map<String, Object> resetTeacherPassword(@RequestBody @Valid TeacherResetPasswordRequest req) {
        var teacher = teacherRepo.findById(req.teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found"));
        var user = userRepo.findByTeacherId(teacher.getTeacherId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        authService.updatePassword(user, req.newPassword);
        return Map.of("ok", true);
    }

    // refresh: refresh token -> yangi access + yangi refresh (rotate)
    @PostMapping("/refresh")
    public AuthResponse refresh(@RequestBody @Valid RefreshRequest req) {
        return authTokenService.refresh(req.getRefreshToken());
    }

    // logout: refresh revoke + (agar yuborsa) access blacklist
    @PostMapping("/logout")
    public Map<String, Object> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String auth,
            @RequestBody @Valid LogoutRequest req
    ) {
        String accessToken = null;

        // case-insensitive + robust token olish
        if (auth != null && auth.toLowerCase().startsWith("bearer ")) {
            accessToken = auth.substring(auth.indexOf(' ') + 1);
            accessToken = accessToken.trim().replaceAll("\\s+", "");
        }

        authTokenService.logout(req.getRefreshToken(), accessToken);

        // bu yerda Map.of OK (null yo‘q)
        return Map.of("ok", true);
    }

    // me: token shart (401/200 bo‘ladi, 500 bo‘lmaydi)
    @GetMapping("/me")
    public Map<String, Object> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        Object pr = auth.getPrincipal();

        // ba'zan Spring "anonymousUser" (String) qilib yuboradi
        if (pr instanceof String s && "anonymousUser".equalsIgnoreCase(s)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized (anonymous)");
        }

        if (!(pr instanceof UserPrincipal me)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Principal type=" + pr.getClass().getName()
            );
        }

        // ✅ Map.of null value qabul qilmaydi, shuning uchun LinkedHashMap
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("username", me.getUsername());
        res.put("role", me.getRole());
        res.put("teacherId", me.getTeacherId());

        return res;
    }
}
