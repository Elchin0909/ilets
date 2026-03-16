package com.example.ielts.controller;

import com.example.ielts.entity.Homework;
import com.example.ielts.entity.HomeworkSubmission;
import com.example.ielts.repo.*;
import com.example.ielts.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/homework")
@RequiredArgsConstructor
public class HomeworkController {

    private final HomeworkRepository homeworkRepo;
    private final HomeworkSubmissionRepository submissionRepo;
    private final StudentRepository studentRepo;
    private final EnrollmentRepository enrollmentRepo;

    // ───── TEACHER / ADMIN endpoints ─────

    /** Create homework for a group */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Homework create(@RequestBody Homework hw,
                           @AuthenticationPrincipal UserPrincipal principal) {
        hw.setHomeworkId(null);
        if (hw.getTeacherId() == null) {
            hw.setTeacherId(principal.getTeacherId());
        }
        hw.setStatus("OPEN");
        return homeworkRepo.save(hw);
    }

    /** List homework for a group */
    @GetMapping("/group/{groupId}")
    @PreAuthorize("isAuthenticated()")
    public List<Map<String, Object>> listByGroup(@PathVariable UUID groupId) {
        var list = homeworkRepo.findByGroupIdOrderByCreatedAtDesc(groupId);
        return list.stream().map(this::enrich).toList();
    }

    /** List all homework (admin) */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public List<Map<String, Object>> listAll() {
        return homeworkRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(this::enrich).toList();
    }

    /** Get single homework detail with submissions */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getOne(@PathVariable UUID id) {
        Homework hw = homeworkRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        Map<String, Object> m = enrich(hw);
        var subs = submissionRepo.findByHomeworkId(id);
        List<Map<String, Object>> subList = subs.stream().map(s -> {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("submissionId", s.getSubmissionId());
            sm.put("studentId", s.getStudentId());
            studentRepo.findById(s.getStudentId()).ifPresent(st -> sm.put("studentName", st.getFullName()));
            sm.put("content", s.getContent());
            sm.put("fileUrl", s.getFileUrl());
            sm.put("grade", s.getGrade());
            sm.put("feedback", s.getFeedback());
            sm.put("status", s.getStatus());
            sm.put("submittedAt", s.getSubmittedAt());
            sm.put("gradedAt", s.getGradedAt());
            return sm;
        }).toList();
        m.put("submissions", subList);
        return m;
    }

    /** Update homework (title, description, dueDate, status) */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Homework update(@PathVariable UUID id, @RequestBody Homework updated) {
        Homework hw = homeworkRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        hw.setTitle(updated.getTitle());
        hw.setDescription(updated.getDescription());
        hw.setDueDate(updated.getDueDate());
        hw.setStatus(updated.getStatus());
        return homeworkRepo.save(hw);
    }

    /** Delete homework */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        if (!homeworkRepo.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        homeworkRepo.deleteById(id);
    }

    /** Grade a submission */
    @PostMapping("/submissions/{subId}/grade")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public HomeworkSubmission grade(@PathVariable UUID subId,
                                   @RequestBody Map<String, Object> body) {
        HomeworkSubmission sub = submissionRepo.findById(subId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("grade")) {
            sub.setGrade(((Number) body.get("grade")).intValue());
        }
        if (body.containsKey("feedback")) {
            sub.setFeedback((String) body.get("feedback"));
        }
        sub.setStatus("GRADED");
        sub.setGradedAt(LocalDateTime.now());
        return submissionRepo.save(sub);
    }

    // ───── STUDENT endpoints ─────

    /** Student: list my homework (from my enrolled groups) */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public List<Map<String, Object>> myHomework(@AuthenticationPrincipal UserPrincipal principal) {
        UUID studentId = principal.getStudentId();
        if (studentId == null) return List.of();
        var enrollments = enrollmentRepo.findByStudentId(studentId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (var e : enrollments) {
            if (!"ACTIVE".equalsIgnoreCase(e.getStatus())) continue;
            var hwList = homeworkRepo.findByGroupIdOrderByCreatedAtDesc(e.getGroupId());
            for (var hw : hwList) {
                Map<String, Object> m = enrich(hw);
                // Check if student already submitted
                submissionRepo.findByHomeworkIdAndStudentId(hw.getHomeworkId(), studentId)
                        .ifPresent(sub -> {
                            m.put("mySubmission", Map.of(
                                    "submissionId", sub.getSubmissionId(),
                                    "status", sub.getStatus(),
                                    "grade", sub.getGrade() != null ? sub.getGrade() : "",
                                    "feedback", sub.getFeedback() != null ? sub.getFeedback() : ""
                            ));
                        });
                result.add(m);
            }
        }
        result.sort(Comparator.comparing(m -> (String) m.getOrDefault("createdAt", ""), Comparator.reverseOrder()));
        return result;
    }

    /** Student: submit homework */
    @PostMapping("/{hwId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public HomeworkSubmission submit(@PathVariable UUID hwId,
                                    @RequestBody HomeworkSubmission submission,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        if (!homeworkRepo.existsById(hwId))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vazifa topilmadi");

        UUID studentId = principal.getStudentId();
        if (studentId == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        // Check if already submitted
        var existing = submissionRepo.findByHomeworkIdAndStudentId(hwId, studentId);
        if (existing.isPresent()) {
            // Update existing
            HomeworkSubmission s = existing.get();
            s.setContent(submission.getContent());
            s.setFileUrl(submission.getFileUrl());
            s.setStatus("SUBMITTED");
            return submissionRepo.save(s);
        }

        submission.setSubmissionId(null);
        submission.setHomeworkId(hwId);
        submission.setStudentId(studentId);
        submission.setStatus("SUBMITTED");
        return submissionRepo.save(submission);
    }

    // ───── Helpers ─────

    private Map<String, Object> enrich(Homework hw) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("homeworkId", hw.getHomeworkId());
        m.put("groupId", hw.getGroupId());
        m.put("teacherId", hw.getTeacherId());
        m.put("title", hw.getTitle());
        m.put("description", hw.getDescription());
        m.put("dueDate", hw.getDueDate());
        m.put("status", hw.getStatus());
        m.put("createdAt", hw.getCreatedAt());
        m.put("submissionCount", submissionRepo.countByHomeworkId(hw.getHomeworkId()));
        m.put("gradedCount", submissionRepo.countByHomeworkIdAndStatus(hw.getHomeworkId(), "GRADED"));
        return m;
    }
}
