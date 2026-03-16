package com.example.ielts.controller;

import com.example.ielts.dto.StudentCreateRequest;
import com.example.ielts.dto.StudentResponse;
import com.example.ielts.entity.Student;
import com.example.ielts.repo.StudentRepository;
import com.example.ielts.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService service;
    private final StudentRepository studentRepo;

    public StudentController(StudentService service, StudentRepository studentRepo) {
        this.service = service;
        this.studentRepo = studentRepo;
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

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{id}/avatar")
    public StudentResponse updateAvatar(@PathVariable UUID id,
                                        @RequestBody Map<String, String> body) {
        return service.updateAvatar(id, body.get("avatarUrl"));
    }

    @PatchMapping("/{id}/band-score")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Student updateBandScore(@PathVariable UUID id, @RequestBody Map<String, Double> body) {
        Student s = studentRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("ieltsBandScore")) s.setIeltsBandScore(body.get("ieltsBandScore"));
        if (body.containsKey("targetBandScore")) s.setTargetBandScore(body.get("targetBandScore"));
        return studentRepo.save(s);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
