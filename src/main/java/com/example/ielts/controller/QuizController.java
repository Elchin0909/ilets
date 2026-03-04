package com.example.ielts.controller;

import com.example.ielts.dto.*;
import com.example.ielts.entity.User;
import com.example.ielts.repo.UserRepository;
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
    private final UserRepository userRepo;

    public QuizController(QuizService quizService, UserRepository userRepo) {
        this.quizService = quizService;
        this.userRepo = userRepo;
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping("/tests")
    public QuizTestResponse createTest(@RequestBody QuizTestRequest req) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        String role = user.getRole();
        UUID teacherId = user.getTeacherId();
        return quizService.createTest(req, role, teacherId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @GetMapping("/tests")
    public List<QuizTestResponse> listTests() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return quizService.listTests(user.getRole(), user.getTeacherId());
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

    @PreAuthorize("hasRole('ADMIN')")
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        // Need studentId from auth — students have studentId in user or enrollment
        // Try to resolve studentId: students' username = their student profile login
        // For now, look up by username in students (students may have a userId linked)
        // We'll return 204 if no active session
        UUID studentId = resolveStudentId(user);
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        UUID studentId = resolveStudentId(user);
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepo.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        UUID studentId = resolveStudentId(user);
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

    // ── Private helpers ───────────────────────────────────────────────────────

    private UUID resolveStudentId(User user) {
        // Students are users with role STUDENT; their studentId is stored in user.studentId
        // If user has no studentId, they might be admin/teacher (can't take quizzes)
        return user.getStudentId();
    }
}
