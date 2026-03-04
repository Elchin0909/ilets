package com.example.ielts.service;

import com.example.ielts.dto.*;
import com.example.ielts.entity.*;
import com.example.ielts.repo.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private final QuizTestRepository testRepo;
    private final QuizQuestionRepository questionRepo;
    private final QuizSessionRepository sessionRepo;
    private final QuizStudentResultRepository resultRepo;
    private final TeacherRepository teacherRepo;
    private final StudentRepository studentRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public QuizService(QuizTestRepository testRepo,
                       QuizQuestionRepository questionRepo,
                       QuizSessionRepository sessionRepo,
                       QuizStudentResultRepository resultRepo,
                       TeacherRepository teacherRepo,
                       StudentRepository studentRepo,
                       EnrollmentRepository enrollmentRepo) {
        this.testRepo = testRepo;
        this.questionRepo = questionRepo;
        this.sessionRepo = sessionRepo;
        this.resultRepo = resultRepo;
        this.teacherRepo = teacherRepo;
        this.studentRepo = studentRepo;
        this.enrollmentRepo = enrollmentRepo;
    }

    // ── Test CRUD ────────────────────────────────────────────────────────────

    @Transactional
    public QuizTestResponse createTest(QuizTestRequest req, String role, UUID teacherId) {
        if (req.title == null || req.title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Test sarlavhasi majburiy");
        }
        if (req.questions == null || req.questions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kamida 1 savol kerak");
        }

        QuizTest test = new QuizTest();
        test.setTitle(req.title.strip());
        test.setLevel(req.level != null ? req.level : "BEGINNER");
        test.setCreatedByRole(role);
        test.setTeacherId(teacherId);
        test.setApproved("ADMIN".equals(role)); // ADMIN → auto approved

        QuizTest saved = testRepo.save(test);

        int idx = 0;
        for (QuizTestRequest.QuestionItem q : req.questions) {
            QuizQuestion qq = new QuizQuestion();
            qq.setTestId(saved.getTestId());
            qq.setQuestionText(q.text);
            qq.setOptionA(q.optionA);
            qq.setOptionB(q.optionB);
            qq.setOptionC(q.optionC);
            qq.setOptionD(q.optionD);
            qq.setCorrectOption(q.correct != null ? q.correct.toUpperCase() : "A");
            qq.setOrderIndex(idx++);
            questionRepo.save(qq);
        }

        return toTestResponse(saved, req.questions.size());
    }

    public List<QuizTestResponse> listTests(String role, UUID teacherId) {
        List<QuizTest> tests = "ADMIN".equals(role)
                ? testRepo.findAllByOrderByCreatedAtDesc()
                : testRepo.findByTeacherId(teacherId);

        return tests.stream().map(t ->
                toTestResponse(t, (int) questionRepo.countByTestId(t.getTestId()))
        ).toList();
    }

    @Transactional
    public QuizTestResponse approveTest(UUID testId) {
        QuizTest test = testRepo.findById(testId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test topilmadi"));
        test.setApproved(true);
        return toTestResponse(testRepo.save(test),
                (int) questionRepo.countByTestId(testId));
    }

    public List<QuizQuestionDto> getQuestions(UUID testId, boolean includeCorrect) {
        return questionRepo.findByTestIdOrderByOrderIndex(testId).stream()
                .map(q -> toQuestionDto(q, includeCorrect))
                .toList();
    }

    // ── Session ──────────────────────────────────────────────────────────────

    @Transactional
    public QuizSessionResponse startSession(QuizSessionRequest req) {
        QuizTest test = testRepo.findById(req.testId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test topilmadi"));

        if (!test.isApproved()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Test hali tasdiqlanmagan");
        }

        // End any existing active sessions for this group
        List<QuizSession> existing = sessionRepo.findByGroupIdAndStatus(req.groupId, "ACTIVE");
        for (QuizSession s : existing) {
            s.setStatus("COMPLETED");
            sessionRepo.save(s);
        }

        String allowedJson;
        try {
            allowedJson = objectMapper.writeValueAsString(
                    req.allowedStudentIds != null ? req.allowedStudentIds : List.of()
            );
        } catch (Exception e) {
            allowedJson = "[]";
        }

        QuizSession session = new QuizSession();
        session.setTestId(req.testId);
        session.setGroupId(req.groupId);
        session.setStatus("ACTIVE");
        session.setAllowedStudentIds(allowedJson);

        QuizSession saved = sessionRepo.save(session);
        return toSessionResponse(saved, test, false, false);
    }

    /**
     * Returns active session for student (checks their enrolled groups)
     */
    public QuizSessionResponse getActiveSessionForStudent(UUID studentId) {
        // Get all groups the student is enrolled in
        List<UUID> groupIds = enrollmentRepo.findByStudentId(studentId).stream()
                .filter(e -> "ACTIVE".equalsIgnoreCase(e.getStatus()))
                .map(e -> e.getGroupId())
                .toList();

        if (groupIds.isEmpty()) return null;

        // Find active sessions for these groups
        for (UUID groupId : groupIds) {
            List<QuizSession> active = sessionRepo.findByGroupIdAndStatus(groupId, "ACTIVE");
            for (QuizSession session : active) {
                // Check if student is in allowed list
                if (isStudentAllowed(session, studentId)) {
                    QuizTest test = testRepo.findById(session.getTestId()).orElse(null);
                    if (test == null) continue;

                    boolean alreadySubmitted = resultRepo
                            .findBySessionIdAndStudentId(session.getSessionId(), studentId)
                            .isPresent();

                    return toSessionResponse(session, test, true, alreadySubmitted);
                }
            }
        }
        return null;
    }

    /**
     * Get session with questions for student to take
     */
    public QuizSessionResponse getSessionForStudent(UUID sessionId, UUID studentId) {
        QuizSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sessiya topilmadi"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bu imtihon tugagan");
        }
        if (!isStudentAllowed(session, studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Siz bu imtihonga ruxsatsiz");
        }

        boolean alreadySubmitted = resultRepo
                .findBySessionIdAndStudentId(sessionId, studentId).isPresent();

        QuizTest test = testRepo.findById(session.getTestId()).orElseThrow();
        QuizSessionResponse resp = toSessionResponse(session, test, true, alreadySubmitted);
        return resp;
    }

    /**
     * Student submits answers
     */
    @Transactional
    public QuizResultResponse submitAnswers(UUID sessionId, UUID studentId, QuizSubmitRequest req) {
        QuizSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sessiya topilmadi"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bu imtihon tugagan");
        }
        if (!isStudentAllowed(session, studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Siz bu imtihonga ruxsatsiz");
        }
        if (resultRepo.findBySessionIdAndStudentId(sessionId, studentId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Siz bu imtihonni allaqachon topshirgansiz");
        }

        // Get all questions with correct answers
        List<QuizQuestion> questions = questionRepo.findByTestIdOrderByOrderIndex(session.getTestId());
        Map<UUID, String> correctMap = questions.stream()
                .collect(Collectors.toMap(QuizQuestion::getQuestionId, QuizQuestion::getCorrectOption));

        int correct = 0;
        int total = questions.size();

        if (req.answers != null) {
            for (QuizSubmitRequest.AnswerItem ans : req.answers) {
                String expected = correctMap.get(ans.questionId);
                if (expected != null && expected.equalsIgnoreCase(ans.selectedOption)) {
                    correct++;
                }
            }
        }

        // Convert to IELTS-like score (0–9 scale)
        BigDecimal score = total > 0
                ? BigDecimal.valueOf((double) correct / total * 9.0)
                        .setScale(1, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        QuizStudentResult result = new QuizStudentResult();
        result.setSessionId(sessionId);
        result.setStudentId(studentId);
        result.setTotalQuestions(total);
        result.setCorrectAnswers(correct);
        result.setScore(score);

        QuizStudentResult saved = resultRepo.save(result);
        return toResultResponse(saved, studentId);
    }

    /**
     * Get results for a session (admin/teacher view)
     */
    public List<QuizResultResponse> getSessionResults(UUID sessionId) {
        List<QuizStudentResult> results = resultRepo.findBySessionId(sessionId);
        return results.stream()
                .map(r -> toResultResponse(r, r.getStudentId()))
                .toList();
    }

    public List<QuizSessionResponse> getGroupSessions(UUID groupId) {
        return sessionRepo.findByGroupId(groupId).stream()
                .map(s -> {
                    QuizTest test = testRepo.findById(s.getTestId()).orElse(null);
                    return toSessionResponse(s, test, false, false);
                })
                .sorted(Comparator.comparing(r -> ((QuizSessionResponse) r).startedAt).reversed())
                .toList();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private boolean isStudentAllowed(QuizSession session, UUID studentId) {
        String json = session.getAllowedStudentIds();
        if (json == null || json.isBlank() || json.equals("[]")) return true; // no restriction
        try {
            List<String> ids = objectMapper.readValue(json, new TypeReference<>() {});
            return ids.stream().anyMatch(id -> id.equals(studentId.toString()));
        } catch (Exception e) {
            return true;
        }
    }

    private QuizTestResponse toTestResponse(QuizTest t, int questionCount) {
        QuizTestResponse r = new QuizTestResponse();
        r.testId = t.getTestId();
        r.title = t.getTitle();
        r.level = t.getLevel();
        r.createdByRole = t.getCreatedByRole();
        r.teacherId = t.getTeacherId();
        r.approved = t.isApproved();
        r.createdAt = t.getCreatedAt();
        r.questionCount = questionCount;
        if (t.getTeacherId() != null) {
            teacherRepo.findById(t.getTeacherId())
                    .ifPresent(teacher -> r.teacherName = teacher.getFullName());
        }
        return r;
    }

    private QuizQuestionDto toQuestionDto(QuizQuestion q, boolean includeCorrect) {
        QuizQuestionDto dto = new QuizQuestionDto();
        dto.questionId = q.getQuestionId();
        dto.questionText = q.getQuestionText();
        dto.optionA = q.getOptionA();
        dto.optionB = q.getOptionB();
        dto.optionC = q.getOptionC();
        dto.optionD = q.getOptionD();
        dto.orderIndex = q.getOrderIndex();
        if (includeCorrect) dto.correctOption = q.getCorrectOption();
        return dto;
    }

    private QuizSessionResponse toSessionResponse(QuizSession s, QuizTest test,
                                                   boolean includeQuestions,
                                                   boolean alreadySubmitted) {
        QuizSessionResponse r = new QuizSessionResponse();
        r.sessionId = s.getSessionId();
        r.testId = s.getTestId();
        r.testTitle = test != null ? test.getTitle() : "—";
        r.testLevel = test != null ? test.getLevel() : "—";
        r.groupId = s.getGroupId();
        r.status = s.getStatus();
        r.startedAt = s.getStartedAt();
        r.completedAt = s.getCompletedAt();
        r.alreadySubmitted = alreadySubmitted;
        if (includeQuestions) {
            r.questions = questionRepo.findByTestIdOrderByOrderIndex(s.getTestId())
                    .stream().map(q -> toQuestionDto(q, false)).toList();
        }
        return r;
    }

    private QuizResultResponse toResultResponse(QuizStudentResult res, UUID studentId) {
        QuizResultResponse r = new QuizResultResponse();
        r.resultId = res.getResultId();
        r.sessionId = res.getSessionId();
        r.studentId = res.getStudentId();
        r.totalQuestions = res.getTotalQuestions();
        r.correctAnswers = res.getCorrectAnswers();
        r.score = res.getScore();
        r.submittedAt = res.getSubmittedAt();
        studentRepo.findById(res.getStudentId())
                .ifPresent(s -> r.studentName = s.getFullName());
        return r;
    }
}
