package com.example.ielts.controller;

import com.example.ielts.dto.*;
import com.example.ielts.security.UserPrincipal;
import com.example.ielts.service.QuizService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private UserPrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return (UserPrincipal) auth.getPrincipal();
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping("/tests")
    public QuizTestResponse createTest(@RequestBody QuizTestRequest req) {
        UserPrincipal p = currentPrincipal();
        return quizService.createTest(req, p.getRole(), p.getTeacherId());
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/tests")
    public List<QuizTestResponse> listTests() {
        UserPrincipal p = currentPrincipal();
        return quizService.listTests(p.getRole(), p.getTeacherId());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/tests/{id}/approve")
    public QuizTestResponse approveTest(@PathVariable UUID id) {
        return quizService.approveTest(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/tests/{id}/questions")
    public List<QuizQuestionDto> getQuestions(@PathVariable UUID id) {
        return quizService.getQuestions(id, true);
    }

    // ── Sessions ─────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping("/sessions")
    public QuizSessionResponse startSession(@RequestBody QuizSessionRequest req) {
        return quizService.startSession(req);
    }

    /**
     * GET /api/quiz/sessions/active
     * Returns active session for the current student (checks enrolled groups).
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/sessions/active")
    public QuizSessionResponse getActiveSession() {
        UserPrincipal p = currentPrincipal();
        UUID studentId = p.getStudentId();
        if (studentId == null) return null;
        return quizService.getActiveSessionForStudent(studentId);
    }

    /**
     * GET /api/quiz/sessions/{id}/take
     * Returns session with questions for the student to take.
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/sessions/{id}/take")
    public QuizSessionResponse getSessionForStudent(@PathVariable UUID id) {
        UserPrincipal p = currentPrincipal();
        UUID studentId = p.getStudentId();
        if (studentId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Talaba tizimda topilmadi");
        }
        return quizService.getSessionForStudent(id, studentId);
    }

    /**
     * POST /api/quiz/sessions/{id}/submit
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/sessions/{id}/submit")
    public QuizResultResponse submitAnswers(@PathVariable UUID id,
                                            @RequestBody QuizSubmitRequest req) {
        UserPrincipal p = currentPrincipal();
        UUID studentId = p.getStudentId();
        if (studentId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Talaba tizimda topilmadi");
        }
        return quizService.submitAnswers(id, studentId, req);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/sessions/{id}/results")
    public List<QuizResultResponse> getResults(@PathVariable UUID id) {
        return quizService.getSessionResults(id);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/sessions/by-group/{groupId}")
    public List<QuizSessionResponse> getGroupSessions(@PathVariable UUID groupId) {
        return quizService.getGroupSessions(groupId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/results/by-student/{studentId}")
    public List<QuizResultResponse> getStudentResults(@PathVariable UUID studentId) {
        return quizService.getStudentResults(studentId);
    }
}
