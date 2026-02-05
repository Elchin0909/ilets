package com.example.ielts.service;

import com.example.ielts.dto.ExamCreateRequest;
import com.example.ielts.dto.ExamResponse;
import com.example.ielts.entity.Exam;
import com.example.ielts.repo.ExamRepository;
import com.example.ielts.repo.GroupRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ExamService {

    private final ExamRepository examRepo;
    private final GroupRepository groupRepo;

    public ExamService(ExamRepository examRepo, GroupRepository groupRepo) {
        this.examRepo = examRepo;
        this.groupRepo = groupRepo;
    }

    public ExamResponse create(ExamCreateRequest req) {
        if (!groupRepo.existsById(req.groupId)) throw new RuntimeException("Group not found");

        Exam e = new Exam();
        e.setGroupId(req.groupId);
        e.setTitle(req.title);
        e.setExamDate(req.examDate);

        return toResponse(examRepo.save(e));
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
