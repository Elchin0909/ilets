package com.example.ielts.controller;

import com.example.ielts.dto.ExamCreateRequest;
import com.example.ielts.dto.ExamResponse;
import com.example.ielts.service.ExamService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamService service;

    public ExamController(ExamService service) {
        this.service = service;
    }

    @PostMapping
    public ExamResponse create(@RequestBody @Valid ExamCreateRequest req) {
        return service.create(req);
    }

    // Teacher faqat o'z groupidagi examlarni ko'ra oladi
    @PreAuthorize("@guard.canAccessGroup(#groupId)")
    @GetMapping("/by-group/{groupId}")
    public List<ExamResponse> byGroup(@PathVariable UUID groupId) {
        return service.byGroup(groupId);
    }

    // Teacher faqat o'z examini ko'ra oladi
    @PreAuthorize("@guard.canAccessExam(#examId)")
    @GetMapping("/{examId}")
    public ExamResponse get(@PathVariable UUID examId) {
        return service.get(examId);
    }
}
