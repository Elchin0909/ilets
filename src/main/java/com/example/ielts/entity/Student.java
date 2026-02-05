package com.example.ielts.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "students", schema = "app")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // Hibernate UUID generator
    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "full_name", nullable = false, length = 180)
    private String fullName;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 120, unique = true)
    private String email;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // getters/setters
    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
