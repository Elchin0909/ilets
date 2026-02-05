package com.example.ielts.controller;

import com.example.ielts.dto.auth.AuthResponse;
import com.example.ielts.dto.auth.LogoutRequest;
import com.example.ielts.dto.auth.RefreshRequest;
import com.example.ielts.service.AuthTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthTokenController {

    private final AuthTokenService service;

    public AuthTokenController(AuthTokenService service) {
        this.service = service;
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return service.refresh(req.getRefreshToken());
    }

    @PostMapping("/logout")
    public void logout(@Valid @RequestBody LogoutRequest req,
                       @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader) {

        String access = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            access = authHeader.substring(7);
        }
        service.logout(req.getRefreshToken(), access);
    }
}
