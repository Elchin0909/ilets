package com.example.ielts.controller;

import com.example.ielts.entity.WritingLog;
import com.example.ielts.repo.WritingLogRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/writing-logs")
public class WritingLogController {

    private final WritingLogRepository repo;

    public WritingLogController(WritingLogRepository repo) {
        this.repo = repo;
    }

    /** Barcha yozma tekshiruvlar (admin/teacher uchun) */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','RECEPTION')")
    public List<WritingLog> getAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    /** Bitta talabaning yozma tarixi */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("isAuthenticated()")
    public List<WritingLog> getByStudent(@PathVariable UUID studentId) {
        return repo.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    /** Statistika: darajalar bo'yicha */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','RECEPTION')")
    public Map<String, Object> getStats() {
        Map<String, Long> byLevel = new HashMap<>();
        for (Object[] row : repo.countByLevel()) {
            byLevel.put((String) row[0], (Long) row[1]);
        }

        Map<String, Long> byTaskType = new HashMap<>();
        for (Object[] row : repo.countByTaskType()) {
            byTaskType.put((String) row[0], (Long) row[1]);
        }

        long total = repo.count();
        List<WritingLog> recent = repo.findAllByOrderByCreatedAtDesc()
                .stream().limit(10).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("byLevel", byLevel);
        result.put("byTaskType", byTaskType);
        result.put("recent", recent);
        return result;
    }
}
