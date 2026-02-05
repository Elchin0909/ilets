package com.example.ielts.controller;

import com.example.ielts.dto.TeacherCreateRequest;
import com.example.ielts.dto.TeacherResponse;
import com.example.ielts.service.TeacherService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final TeacherService service;

    public TeacherController(TeacherService service) {
        this.service = service;
    }

    @PostMapping
    public TeacherResponse create(@RequestBody @Valid TeacherCreateRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<TeacherResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public TeacherResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PutMapping("/{id}")
    public TeacherResponse update(@PathVariable UUID id,
                                  @RequestBody @Valid TeacherCreateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
