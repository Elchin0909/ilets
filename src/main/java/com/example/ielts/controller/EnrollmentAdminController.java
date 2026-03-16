package com.example.ielts.controller;

import com.example.ielts.dto.EnrollmentCreateRequest;
import com.example.ielts.dto.EnrollmentResponse;
import com.example.ielts.service.EnrollmentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentAdminController {

    private final EnrollmentService service;

    public EnrollmentAdminController(EnrollmentService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @PostMapping
    public EnrollmentResponse create(@RequestBody @Valid EnrollmentCreateRequest req) {
        return service.create(req);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @GetMapping
    public List<EnrollmentResponse> list() {
        return service.list();
    }

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @GetMapping("/by-student/{studentId}")
    public List<EnrollmentResponse> byStudent(@PathVariable UUID studentId) {
        return service.listByStudent(studentId);
    }

    // Talaba o'z guruhlarini ko'rishi uchun
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/my/{studentId}")
    public List<EnrollmentResponse> myEnrollments(@PathVariable UUID studentId) {
        return service.listByStudent(studentId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @PatchMapping("/{id}/status")
    public EnrollmentResponse changeStatus(@PathVariable UUID id,
                                           @RequestParam String status) {
        return service.changeStatus(id, status);
    }
}
