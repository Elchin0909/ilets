package com.example.ielts.controller;

import com.example.ielts.dto.GroupCreateRequest;
import com.example.ielts.dto.GroupResponse;
import com.example.ielts.dto.EnrollmentResponse;
import com.example.ielts.entity.Enrollment;
import com.example.ielts.repo.EnrollmentRepository;
import com.example.ielts.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService service;
    private final EnrollmentRepository enrollmentRepo;

    public GroupController(GroupService service, EnrollmentRepository enrollmentRepo) {
        this.service = service;
        this.enrollmentRepo = enrollmentRepo;
    }

    @PostMapping
    public GroupResponse create(@RequestBody @Valid GroupCreateRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<GroupResponse> list() {
        return service.list();
    }

    @PreAuthorize("@guard.canAccessGroup(#id)")
    @GetMapping("/{id}")
    public GroupResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PutMapping("/{id}")
    public GroupResponse update(@PathVariable UUID id,
                                @RequestBody @Valid GroupCreateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }



    private EnrollmentResponse toDto(Enrollment e) {
        EnrollmentResponse r = new EnrollmentResponse();
        r.enrollmentId = e.getEnrollmentId();
        r.groupId = e.getGroupId();
        r.studentId = e.getStudentId();
        r.enrolledAt = e.getEnrolledAt();
        r.status = e.getStatus();
        return r;
    }
}
