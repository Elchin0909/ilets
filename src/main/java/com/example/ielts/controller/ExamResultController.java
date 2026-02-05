package com.example.ielts.controller;

import com.example.ielts.dto.ExamResultBulkRequest;
import com.example.ielts.dto.ExamResultResponse;
import com.example.ielts.dto.ExamResultUpsertRequest;
import com.example.ielts.service.AuditLogService;
import com.example.ielts.service.ExamResultService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/exams")
public class ExamResultController {

    private final ExamResultService service;
    private final AuditLogService audit;

    public ExamResultController(ExamResultService service, AuditLogService audit) {
        this.service = service;
        this.audit = audit;
    }

    // Teacher faqat o'z examida result kiritadi
    @PreAuthorize("@guard.canAccessExam(#examId)")
    @PostMapping("/{examId}/results")
    public ExamResultResponse upsert(@PathVariable UUID examId,
                                     @RequestBody @Valid ExamResultUpsertRequest req) {

        ExamResultResponse res = service.upsert(examId, req);

        audit.log("EXAM_RESULT_UPSERT", examId);

        return res;
    }

    // Teacher faqat o'z examida bulk result kiritadi
    @PreAuthorize("@guard.canAccessExam(#examId)")
    @PostMapping("/{examId}/results/bulk")
    public void upsertBulk(@PathVariable UUID examId,
                           @RequestBody @Valid ExamResultBulkRequest req) {

        service.upsertBulk(examId, req);

        audit.log("EXAM_RESULT_BULK_UPSERT", examId);
    }

    // Teacher faqat o'z examining resultlarini ko'radi
    @PreAuthorize("@guard.canAccessExam(#examId)")
    @GetMapping("/{examId}/results")
    public List<ExamResultResponse> byExam(@PathVariable UUID examId) {
        return service.byExam(examId);
    }

    // Student bo'yicha resultlar - teacher uchun xavfli (data leak).
    // Hozircha faqat ADMIN/RECEPTION.
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @GetMapping("/results/by-student/{studentId}")
    public List<ExamResultResponse> byStudent(@PathVariable UUID studentId) {
        return service.byStudent(studentId);
    }
}
