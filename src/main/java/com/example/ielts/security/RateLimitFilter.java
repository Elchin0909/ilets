package com.example.ielts.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;

    public RateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {

        String ip = clientIp(req);
        String path = req.getRequestURI();

        Limit limit;
        if (path.startsWith("/api/auth/login")) {
            limit = new Limit(5, Duration.ofMinutes(1));   // login: 5/min
        } else {
            limit = new Limit(60, Duration.ofMinutes(1));  // global: 60/min
        }

        String key = "rl:" + limit.max + ":" + limit.window.toSeconds()
                + ":" + ip + ":" + bucketName(path);

        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1) {
            redis.expire(key, limit.window);
        }

        if (count != null && count > limit.max) {
            res.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            res.setContentType("application/json");
            res.getWriter().write("""
                {"message":"Too many requests. Slow down."}
            """);
            return;
        }

        chain.doFilter(req, res);
    }

    private String bucketName(String path) {
        if (path.startsWith("/api/auth/")) return "auth";
        return "api";
    }

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    private record Limit(long max, Duration window) {}
}
