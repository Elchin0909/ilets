package com.example.ielts.controller;

import com.example.ielts.dto.CourseCreateRequest;
import com.example.ielts.dto.CourseResponse;
import com.example.ielts.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService service;

    public CourseController(CourseService service) {
        this.service = service;
    }

    @PostMapping
    public CourseResponse create(@RequestBody @Valid CourseCreateRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<CourseResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public CourseResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PutMapping("/{id}")
    public CourseResponse update(@PathVariable UUID id,
                                 @RequestBody @Valid CourseCreateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
