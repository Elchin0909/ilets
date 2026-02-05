package com.example.ielts.service;

import com.example.ielts.dto.ExamResultBulkRequest;
import com.example.ielts.dto.ExamResultResponse;
import com.example.ielts.dto.ExamResultUpsertRequest;
import com.example.ielts.entity.ExamResult;
import com.example.ielts.repo.EnrollmentRepository;
import com.example.ielts.repo.ExamRepository;
import com.example.ielts.repo.ExamResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExamResultService {

    private final ExamRepository examRepo;
    private final ExamResultRepository resultRepo;
    private final EnrollmentRepository enrollmentRepo;

    @Transactional
    public ExamResultResponse upsert(UUID examId, ExamResultUpsertRequest req) {
        if (examId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "examId is required");
        if (req == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is null");
        if (req.studentId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId is required");

        // 404 agar exam yo'q bo'lsa
        var exam = examRepo.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        // student shu groupga enrolledmi?
        boolean enrolled = enrollmentRepo.existsByGroupIdAndStudentId(exam.getGroupId(), req.studentId);
        if (!enrolled) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student is not enrolled in this group");
        }

        // bandlar null bo'lmasin (agar optional qilmoqchi bo'lsang aytasan)
        requireBand(req.listening, "listening");
        requireBand(req.reading, "reading");
        requireBand(req.writing, "writing");
        requireBand(req.speaking, "speaking");

        validateBand(req.listening, "listening");
        validateBand(req.reading, "reading");
        validateBand(req.writing, "writing");
        validateBand(req.speaking, "speaking");

        ExamResult r = new ExamResult();
        r.setExamId(examId);
        r.setStudentId(req.studentId);

        r.setListening(req.listening);
        r.setReading(req.reading);
        r.setWriting(req.writing);
        r.setSpeaking(req.speaking);

        r.setOverall(calcOverall(req.listening, req.reading, req.writing, req.speaking));
        r.setComment(req.comment);

        return toResponse(resultRepo.save(r));
    }

    @Transactional
    public void upsertBulk(UUID examId, ExamResultBulkRequest req) {
        if (examId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "examId is required");
        if (req == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is null");
        if (req.items == null || req.items.isEmpty()) return;

        for (ExamResultUpsertRequest item : req.items) {
            upsert(examId, item);
        }
    }

    @Transactional(readOnly = true)
    public List<ExamResultResponse> byExam(UUID examId) {
        if (examId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "examId is required");

        // Optional: exam yo'q bo'lsa 404 qilib yuboramiz (aks holda bo'sh list qaytib qoladi)
        if (!examRepo.existsById(examId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found");
        }

        return resultRepo.findByExamId(examId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExamResultResponse> byStudent(UUID studentId) {
        if (studentId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "studentId is required");

        return resultRepo.findByStudentId(studentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================
    // HELPERS
    // =========================

    private void requireBand(BigDecimal b, String field) {
        if (b == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
    }

    private void validateBand(BigDecimal b, String field) {
        // 0..9 inclusive
        if (b.compareTo(BigDecimal.ZERO) < 0 || b.compareTo(BigDecimal.valueOf(9)) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be between 0 and 9");
        }
    }

    private BigDecimal calcOverall(BigDecimal l, BigDecimal r, BigDecimal w, BigDecimal s) {
        return l.add(r).add(w).add(s)
                .divide(BigDecimal.valueOf(4), 1, RoundingMode.HALF_UP);
    }

    private ExamResultResponse toResponse(ExamResult e) {
        ExamResultResponse r = new ExamResultResponse();
        r.examId = e.getExamId();
        r.studentId = e.getStudentId();
        r.listening = e.getListening();
        r.reading = e.getReading();
        r.writing = e.getWriting();
        r.speaking = e.getSpeaking();
        r.overall = e.getOverall();
        r.comment = e.getComment();
        r.createdAt = e.getCreatedAt();
        return r;
    }
}
