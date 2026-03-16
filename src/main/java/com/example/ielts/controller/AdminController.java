package com.example.ielts.controller;

import com.example.ielts.entity.User;
import com.example.ielts.repo.StudentRepository;
import com.example.ielts.repo.UserRepository;
import com.example.ielts.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepo;
    private final StudentRepository studentRepo;
    private final AuthService authService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> listUsers() {
        return userRepo.findAll().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", u.getUserId());
            m.put("username", u.getUsername());
            m.put("role", u.getRole());
            m.put("enabled", u.isEnabled());
            m.put("teacherId", u.getTeacherId());
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).toList();
    }

    @PostMapping("/users/{userId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> resetUserPassword(
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body
    ) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parol kamida 4 ta belgidan iborat bo'lishi kerak");
        }
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        authService.updatePassword(user, newPassword);
        return Map.of("ok", true);
    }

    // ===== PENDING STUDENT NOTIFICATIONS (ADMIN + RECEPTION) =====

    @GetMapping("/pending-students")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public List<Map<String, Object>> listPendingStudents() {
        return userRepo.findPendingStudents().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", u.getUserId());
            m.put("username", u.getUsername());
            m.put("studentId", u.getStudentId());
            m.put("createdAt", u.getCreatedAt());
            if (u.getStudentId() != null) {
                studentRepo.findById(u.getStudentId()).ifPresent(s -> {
                    m.put("fullName", s.getFullName());
                    m.put("phone", s.getPhone());
                    m.put("email", s.getEmail());
                });
            }
            return m;
        }).toList();
    }

    @PostMapping("/pending-students/{studentId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public Map<String, Object> approveStudent(@PathVariable UUID studentId) {
        User user = userRepo.findByStudentId(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student user not found"));
        user.setActive(true);
        userRepo.save(user);
        return Map.of("ok", true);
    }

    // ===== STUDENT ACCOUNT MANAGEMENT =====

    @PostMapping("/students/{studentId}/create-account")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public Map<String, Object> createStudentAccount(
            @PathVariable UUID studentId,
            @RequestBody Map<String, String> body
    ) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || username.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username bo'sh bo'lmasligi kerak");
        if (password == null || password.length() < 4)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parol kamida 4 ta belgidan iborat bo'lishi kerak");

        if (userRepo.findByStudentId(studentId).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu talabada allaqachon akkaunt mavjud");
        if (userRepo.findByUsername(username).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu username band");

        studentRepo.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Talaba topilmadi"));

        authService.registerStudent(username, password, studentId);
        return Map.of("ok", true);
    }

    @PostMapping("/students/{studentId}/reset-password")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public Map<String, Object> resetStudentPassword(
            @PathVariable UUID studentId,
            @RequestBody Map<String, String> body
    ) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 4)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parol kamida 4 ta belgidan iborat bo'lishi kerak");
        User user = userRepo.findByStudentId(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bu talabada akkaunt topilmadi"));
        authService.updatePassword(user, newPassword);
        return Map.of("ok", true);
    }

    // ===== CREATE USER (STAFF) =====

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> createUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String role = body.get("role");
        String teacherIdStr = body.get("teacherId");

        if (username == null || username.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username bo'sh bo'lmasligi kerak");
        if (password == null || password.length() < 4)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parol kamida 4 ta belgidan iborat bo'lishi kerak");
        if (role == null || role.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role kerak");
        if (userRepo.findByUsername(username).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bu username band");

        Set<String> allowedRoles = Set.of("RECEPTION", "TEACHER", "MANAGER", "ADMIN");
        if (!allowedRoles.contains(role))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Noto'g'ri role: " + role);

        UUID teacherId = null;
        if ("TEACHER".equals(role) && teacherIdStr != null && !teacherIdStr.isBlank()) {
            teacherId = UUID.fromString(teacherIdStr);
        }

        User u = new User();
        u.setUsername(username);
        u.setPasswordHash(authService.encodePassword(password));
        u.setRole(role);
        u.setTeacherId(teacherId);
        u.setActive(true);
        userRepo.save(u);
        return Map.of("ok", true, "userId", u.getUserId());
    }
}
