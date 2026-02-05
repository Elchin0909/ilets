package com.example.ielts.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimitFilter.class);

    private final StringRedisTemplate redis;

    private static final int LIMIT = 10;                          // 10 urinish
    private static final Duration WINDOW = Duration.ofMinutes(1);  // 1 minutda

    public LoginRateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /**
     * ✅ Faqat login endpointlar (POST) uchun ishlaydi.
     * Qolgan hammasini skip qiladi.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String p = request.getServletPath();
        String m = request.getMethod();

        if (!"POST".equalsIgnoreCase(m)) return true;

        boolean isLogin =
                p.equals("/api/auth/login") ||
                        p.equals("/api/auth/login-v2") ||
                        p.equals("/api/v1/auth/login") ||
                        p.equals("/api/v1/auth/login-v2");

        return !isLogin;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String ip = clientIp(request);
        String key = "rl:login:" + ip;

        try {
            Long count = redis.opsForValue().increment(key);

            // birinchi urinishda TTL qo'yamiz
            if (count != null && count == 1L) {
                redis.expire(key, WINDOW);
            }

            if (count != null && count > LIMIT) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("""
                        {"status":429,"message":"Too many login attempts. Please try again later.","path":"%s"}
                        """.formatted(request.getRequestURI()));
                return;
            }

            // xohlasang debug:
            // log.info("Login rate-limit ok: ip={} count={}", ip, count);

        } catch (Exception e) {
            // ✅ Redis yiqilsa ham login ishlayversin (fail-open)
            log.warn("LoginRateLimitFilter Redis error (fail-open): {}", e.toString());
        }

        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
