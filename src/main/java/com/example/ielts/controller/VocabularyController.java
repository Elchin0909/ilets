package com.example.ielts.controller;

import com.example.ielts.entity.VocabularyItem;
import com.example.ielts.repo.VocabularyItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vocabulary")
public class VocabularyController {

    private final VocabularyItemRepository repo;

    public VocabularyController(VocabularyItemRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("isAuthenticated()")
    public List<VocabularyItem> getByStudent(@PathVariable UUID studentId) {
        return repo.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public VocabularyItem create(@RequestBody VocabularyItem item) {
        item.setItemId(null);
        return repo.save(item);
    }

    @DeleteMapping("/{itemId}")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID itemId) {
        if (!repo.existsById(itemId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        repo.deleteById(itemId);
    }
}
