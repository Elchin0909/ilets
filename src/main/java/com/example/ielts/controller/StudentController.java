package com.example.ielts.controller;

import com.example.ielts.dto.StudentCreateRequest;
import com.example.ielts.dto.StudentResponse;
import com.example.ielts.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @PostMapping
    public StudentResponse create(@RequestBody @Valid StudentCreateRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<StudentResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public StudentResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @PutMapping("/{id}")
    public StudentResponse update(@PathVariable UUID id, @RequestBody @Valid StudentCreateRequest req) {
        return service.update(id, req);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
