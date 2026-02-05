package com.example.ielts.controller;

import com.example.ielts.dto.EnrollmentResponse;
import com.example.ielts.entity.Enrollment;
import com.example.ielts.repo.EnrollmentRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups/{groupId}/enrollments")
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepo;

    public EnrollmentController(EnrollmentRepository enrollmentRepo) {
        this.enrollmentRepo = enrollmentRepo;
    }

    // xohlasang guard bilan yop:
    // @PreAuthorize("@guard.canAccessGroup(#groupId)")
    @GetMapping
    public List<EnrollmentResponse> listByGroup(@PathVariable UUID groupId) {
        return enrollmentRepo.findByGroupId(groupId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private EnrollmentResponse toResponse(Enrollment e) {
        EnrollmentResponse r = new EnrollmentResponse();
        r.enrollmentId = e.getEnrollmentId();
        r.groupId = e.getGroupId();
        r.studentId = e.getStudentId();
        r.enrolledAt = e.getEnrolledAt();
        r.status = e.getStatus();
        return r;
    }
}
