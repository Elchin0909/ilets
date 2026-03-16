package com.example.ielts.controller;

import com.example.ielts.entity.Resource;
import com.example.ielts.repo.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceRepository repo;

    public ResourceController(ResourceRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Resource> getAll(@RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return repo.findByCategoryOrderByCreatedAtDesc(category.toUpperCase());
        }
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Resource create(@RequestBody Resource resource) {
        resource.setResourceId(null);
        return repo.save(resource);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Resource update(@PathVariable UUID id, @RequestBody Resource resource) {
        Resource existing = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setTitle(resource.getTitle());
        existing.setDescription(resource.getDescription());
        existing.setCategory(resource.getCategory());
        existing.setType(resource.getType());
        existing.setFileUrl(resource.getFileUrl());
        existing.setLinkUrl(resource.getLinkUrl());
        return repo.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        repo.deleteById(id);
    }
}
