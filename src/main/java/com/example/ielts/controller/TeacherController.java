package com.example.ielts.controller;

import com.example.ielts.dto.TeacherCreateRequest;
import com.example.ielts.dto.TeacherResponse;
import com.example.ielts.service.TeacherService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final TeacherService service;

    public TeacherController(TeacherService service) {
        this.service = service;
    }

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
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

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @PutMapping("/{id}")
    public TeacherResponse update(@PathVariable UUID id,
                                  @RequestBody @Valid TeacherCreateRequest req) {
        return service.update(id, req);
    }

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{id}/avatar")
    public TeacherResponse updateAvatar(@PathVariable UUID id,
                                        @RequestBody Map<String, String> body) {
        return service.updateAvatar(id, body.get("avatarUrl"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
