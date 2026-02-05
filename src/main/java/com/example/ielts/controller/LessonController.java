package com.example.ielts.controller;

import com.example.ielts.dto.LessonCreateRequest;
import com.example.ielts.entity.Lesson;
import com.example.ielts.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService service;

    @PostMapping
    public Lesson create(@RequestBody @Valid LessonCreateRequest req) {
        return service.create(req);
    }

    // Teacher faqat o'z groupidagi lessonlarni ko'ra oladi
    @PreAuthorize("@guard.canAccessGroup(#groupId)")
    @GetMapping("/by-group/{groupId}")
    public List<Lesson> byGroup(@PathVariable UUID groupId) {
        return service.byGroup(groupId);
    }
}



