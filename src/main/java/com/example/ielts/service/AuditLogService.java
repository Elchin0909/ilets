package com.example.ielts.service;

import com.example.ielts.entity.AuditLog;
import com.example.ielts.repo.AuditLogRepository;
import com.example.ielts.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuditLogService {

    private final AuditLogRepository repo;
    private final HttpServletRequest request;

    public AuditLogService(AuditLogRepository repo, HttpServletRequest request) {
        this.repo = repo;
        this.request = request;
    }

    /**
     * Universal audit logger (ASYNC)
     */
    @Async
    public void log(String action,
                    String entityType,
                    UUID entityId,
                    String details) {

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            String username = "anonymous";
            String role = "ANON";

            if (auth != null && auth.getPrincipal() instanceof UserPrincipal p) {
                username = p.getUsername();
                role = p.getRole();
            }

            AuditLog a = new AuditLog();
            a.setUsername(username);
            a.setRole(role);
            a.setAction(action);
            a.setEntityType(entityType);
            a.setEntityId(entityId);
            a.setDetails(trim(details, 500));
            a.setIp(clientIp());
            a.setUserAgent(trim(request.getHeader("User-Agent"), 200));

            repo.save(a);

        } catch (Exception ignored) {
            // audit failure hech qachon API'ni yiqitmasin
        }
    }

    // backward compatibility (senda eski chaqiruvlar bo'lsa)
    @Async
    public void log(String action, UUID entityId) {
        log(action, null, entityId, null);
    }

    private String clientIp() {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }

    private String trim(String s, int max) {
        if (s == null) return null;
        s = s.trim();
        if (s.length() <= max) return s;
        return s.substring(0, max);
    }
}
