package com.example.ielts.service;

import com.example.ielts.dto.ExamCreateRequest;
import com.example.ielts.dto.ExamResponse;
import com.example.ielts.entity.Exam;
import com.example.ielts.repo.ExamRepository;
import com.example.ielts.repo.ExamResultRepository;
import com.example.ielts.repo.GroupRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ExamService {

    private final ExamRepository examRepo;
    private final GroupRepository groupRepo;
    private final ExamResultRepository examResultRepo;

    public ExamService(ExamRepository examRepo, GroupRepository groupRepo, ExamResultRepository examResultRepo) {
        this.examRepo = examRepo;
        this.groupRepo = groupRepo;
        this.examResultRepo = examResultRepo;
    }

    public ExamResponse create(ExamCreateRequest req) {
        if (!groupRepo.existsById(req.groupId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");

        Exam e = new Exam();
        e.setGroupId(req.groupId);
        e.setTitle(req.title);
        e.setExamDate(req.examDate);

        return toResponse(examRepo.save(e));
    }

    public ExamResponse update(UUID id, ExamCreateRequest req) {
        Exam e = examRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        if (req.title != null) e.setTitle(req.title);
        if (req.examDate != null) e.setExamDate(req.examDate);

        return toResponse(examRepo.save(e));
    }

    @Transactional
    public void delete(UUID id) {
        if (!examRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found");
        }
        examResultRepo.deleteAll(examResultRepo.findByExamId(id));
        examRepo.deleteById(id);
    }

    public List<ExamResponse> byGroup(UUID groupId) {
        return examRepo.findByGroupId(groupId).stream().map(this::toResponse).toList();
    }

    public ExamResponse get(UUID examId) {
        return toResponse(examRepo.findById(examId).orElseThrow());
    }

    private ExamResponse toResponse(Exam e) {
        ExamResponse r = new ExamResponse();
        r.examId = e.getExamId();
        r.groupId = e.getGroupId();
        r.title = e.getTitle();
        r.examDate = e.getExamDate();
        r.createdAt = e.getCreatedAt();
        return r;
    }
}
