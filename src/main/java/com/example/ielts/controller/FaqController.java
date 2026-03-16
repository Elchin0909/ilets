package com.example.ielts.controller;

import com.example.ielts.entity.Faq;
import com.example.ielts.repo.FaqRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/faq")
public class FaqController {

    private final FaqRepository repo;

    public FaqController(FaqRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Faq> getAll() {
        return repo.findAllByOrderBySortOrderAscCreatedAtAsc();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public Faq create(@RequestBody Faq faq) {
        faq.setFaqId(null);
        return repo.save(faq);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public Faq update(@PathVariable UUID id, @RequestBody Faq faq) {
        Faq existing = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        existing.setQuestion(faq.getQuestion());
        existing.setAnswer(faq.getAnswer());
        existing.setSortOrder(faq.getSortOrder());
        return repo.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        repo.deleteById(id);
    }
}
