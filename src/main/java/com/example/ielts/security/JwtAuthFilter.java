package com.example.ielts.security;

import com.example.ielts.repo.UserRepository;
import com.example.ielts.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwt;
    private final UserRepository userRepo;
    private final TokenBlacklistService blacklist;

    public JwtAuthFilter(JwtService jwt, UserRepository userRepo, TokenBlacklistService blacklist) {
        this.jwt = jwt;
        this.userRepo = userRepo;
        this.blacklist = blacklist;
    }
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String p = request.getServletPath();

        if (p.startsWith("/swagger-ui")
                || p.startsWith("/v3/api-docs")
                || p.equals("/swagger-ui.html")
                || p.equals("/error")) {
            return true;
        }

        // faqat public auth endpointlar
        return p.equals("/api/auth/login-v2")
                || p.equals("/api/auth/refresh")
                || p.equals("/api/auth/logout")
                || p.equals("/api/auth/register");
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        log.info("AUTH HEADER RAW: [{}] path={}", auth, path);

        // header yo‘q bo‘lsa — o‘tamiz
        if (auth == null || auth.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bearer bo‘lmasa — o‘tamiz
        if (!auth.regionMatches(true, 0, "Bearer ", 0, 7)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = normalizeToken(auth.substring(7));

        if (token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        log.info("TOKEN LEN={}, first20=[{}]",
                token.length(),
                token.substring(0, Math.min(20, token.length()))
        );

        try {
            // already authenticated?
            if (SecurityContextHolder.getContext().getAuthentication() != null) {
                filterChain.doFilter(request, response);
                return;
            }

            // blacklist check
            String tokenHash = TokenHash.sha256(token);
            boolean blacklisted = blacklist.isBlacklisted(tokenHash);
            log.info("TOKEN blacklisted={}", blacklisted);

            if (blacklisted) {
                filterChain.doFilter(request, response);
                return;
            }

            // extract username (bu joyda ExpiredJwtException chiqishi mumkin)
            String username = jwt.extractUsername(token);
            log.info("JWT username extracted=[{}]", username);

            if (username == null || username.isBlank()) {
                filterChain.doFilter(request, response);
                return;
            }

            var u = userRepo.findByUsername(username).orElse(null);
            log.info("DB user found? {}", (u != null));

            // Allow inactive students to use limited endpoints (support/FAQ)
            if (u == null || (!u.isActive() && !"STUDENT".equals(u.getRole()))) {
                filterChain.doFilter(request, response);
                return;
            }

            String role = u.getRole(); // ADMIN / TEACHER / RECEPTION
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

            var principal = new UserPrincipal(u.getUsername(), role, u.getTeacherId(), u.getStudentId());
            var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.info("AUTH SET: username={}, role={}, authorities={}",
                    principal.getUsername(), principal.getRole(), authorities);

        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            // ✅ expired token bo‘lsa — bu filter serverni yiqitmasin
            log.warn("JWT expired on path={}: {}", path, e.getMessage());
        } catch (Exception e) {
            log.warn("JWT FILTER ERROR on path: {}", path, e);
        }

        filterChain.doFilter(request, response);
    }

    private String normalizeToken(String token) {
        if (token == null) return "";
        return token.trim().replaceAll("\\s+", "");
    }
}

