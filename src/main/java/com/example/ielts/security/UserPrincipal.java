package com.example.ielts.security;

import java.util.UUID;

public class UserPrincipal {
    private final String username;
    private final String role;
    private final UUID teacherId;  // nullable
    private final UUID studentId;  // nullable

    public UserPrincipal(String username, String role, UUID teacherId, UUID studentId) {
        this.username = username;
        this.role = role;
        this.teacherId = teacherId;
        this.studentId = studentId;
    }

    public String getUsername() { return username; }
    public String getRole() { return role; }
    public UUID getTeacherId() { return teacherId; }
    public UUID getStudentId() { return studentId; }

    public boolean isAdmin() { return "ADMIN".equals(role); }
    public boolean isTeacher() { return "TEACHER".equals(role); }
    public boolean isStudent() { return "STUDENT".equals(role); }
}
