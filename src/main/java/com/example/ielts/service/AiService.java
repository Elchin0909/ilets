package com.example.ielts.service;

import com.example.ielts.dto.BandPredictionResponse;
import com.example.ielts.dto.WritingAssessResponse;
import com.example.ielts.entity.ExamResult;
import com.example.ielts.entity.WritingLog;
import com.example.ielts.repo.ExamResultRepository;
import com.example.ielts.repo.GroupRepository;
import com.example.ielts.repo.StudentRepository;
import com.example.ielts.repo.TeacherRepository;
import com.example.ielts.repo.WritingLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiService {

    @Value("${anthropic.api.key:-}")
    private String apiKey;

    @Value("${anthropic.api.model:claude-3-5-haiku-20241022}")
    private String model;

    private final ExamResultRepository examResultRepo;
    private final StudentRepository studentRepo;
    private final GroupRepository groupRepo;
    private final TeacherRepository teacherRepo;
    private final WritingLogRepository writingLogRepo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AiService(ExamResultRepository examResultRepo,
                     StudentRepository studentRepo,
                     GroupRepository groupRepo,
                     TeacherRepository teacherRepo,
                     WritingLogRepository writingLogRepo) {
        this.examResultRepo = examResultRepo;
        this.studentRepo = studentRepo;
        this.groupRepo = groupRepo;
        this.teacherRepo = teacherRepo;
        this.writingLogRepo = writingLogRepo;
    }

    // ── 1. Band Score Bashorati ────────────────────────────────────────────────

    public BandPredictionResponse predictBand(UUID studentId) {
        checkApiKey();

        var student = studentRepo.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Talaba topilmadi"));

        List<ExamResult> results = examResultRepo.findByStudentId(studentId);

        if (results.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bu talabaning imtihon natijalari yo'q. Avval natijalarni kiriting.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Talaba: ").append(student.getFullName()).append("\n");
        sb.append("Mock test natijalari:\n");
        int i = 1;
        for (ExamResult r : results) {
            sb.append(i++).append(". ");
            if (r.getListening() != null) sb.append("Listening: ").append(r.getListening()).append(" | ");
            if (r.getReading() != null) sb.append("Reading: ").append(r.getReading()).append(" | ");
            if (r.getWriting() != null) sb.append("Writing: ").append(r.getWriting()).append(" | ");
            if (r.getSpeaking() != null) sb.append("Speaking: ").append(r.getSpeaking()).append(" | ");
            if (r.getOverall() != null) sb.append("Umumiy: ").append(r.getOverall());
            sb.append("\n");
        }

        String systemPrompt = """
                Siz tajribali IELTS mutaxassisi siz. Talabaning mock test natijalariga asosan
                yakuniy IELTS band skorini bashorat qiling. O'zbekcha qisqa va aniq javob bering.

                Faqat JSON formatida javob bering, boshqa matn yozmang:
                {"predictedBand":"6.5","confidence":"yuqori","weakestSkill":"Writing","analysis":"...","recommendations":"..."}

                confidence qiymatlari: "yuqori" (ko'p natija bor), "o'rta" (2-3 natija), "past" (1 ta natija)
                """;

        String raw = callAnthropic(systemPrompt, sb.toString());
        return parseJson(raw, BandPredictionResponse.class);
    }

    // ── 2. Writing Baholash ────────────────────────────────────────────────────

    public WritingAssessResponse assessWriting(String text, String taskType, UUID studentId) {
        checkApiKey();

        if (text == null || text.strip().split("\\s+").length < 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Matn juda qisqa. Kamida 30 so'z kiriting.");
        }

        String taskLabel = "task2".equalsIgnoreCase(taskType)
                ? "Task 2 (Esse / fikr bildirish)"
                : "Task 1 (Rasmiy / tavsiflovchi)";

        String systemPrompt = """
                Siz malakali IELTS Writing examinator siz. Quyidagi %s yozmasini
                rasmiy IELTS 4 ta kriteriya bo'yicha baholang.

                Darajalar (band asosida):
                - Beginner:    Band 1.0 – 3.5
                - Elementary:  Band 4.0 – 4.5
                - Pre-IELTS:   Band 5.0 – 5.5
                - IELTS Ready: Band 6.0 – 6.5
                - Advanced:    Band 7.0+

                Har bir kriteriy uchun O'zbekcha qisqa tahlil yozing (1-2 jumla).
                Faqat JSON formatida javob bering, boshqa matn yozmang:
                {"level":"Pre-IELTS","bandRange":"5.0–5.5","taskAchievement":"...","coherence":"...","grammar":"...","vocabulary":"...","recommendations":"..."}
                """.formatted(taskLabel);

        String raw = callAnthropic(systemPrompt, "Yozma matn:\n\n" + text);
        WritingAssessResponse result = parseJson(raw, WritingAssessResponse.class);

        // WritingLog saqlash
        try {
            WritingLog log = new WritingLog();
            log.setTaskType(taskType);
            log.setLevel(result.level);
            log.setBandRange(result.bandRange);
            log.setTextSnippet(text.length() > 300 ? text.substring(0, 300) : text);
            if (studentId != null) {
                log.setStudentId(studentId);
                studentRepo.findById(studentId)
                        .ifPresent(s -> log.setStudentName(s.getFullName()));
            }
            writingLogRepo.save(log);
        } catch (Exception ignored) {
            // Log saqlash xatosi asosiy javobga ta'sir qilmasin
        }

        return result;
    }

    // ── 3. AI Chatbot ──────────────────────────────────────────────────────────

    public String chat(String message) {
        checkApiKey();

        long studentsCount = studentRepo.count();
        long teachersCount = teacherRepo.count();
        long groupsCount = groupRepo.count();

        String systemPrompt = """
                Siz IELTS markazi boshqaruv tizimining AI yordamchisi siz.

                Tizim haqida ma'lumot:
                - Jami talabalar: %d
                - Jami o'qituvchilar: %d
                - Jami guruhlar: %d

                Qisqa, foydali va do'stona O'zbekcha javob bering.
                Agar savol tizimdan tashqarida bo'lsa, IELTS bilan bog'liq maslahat bering.
                """.formatted(studentsCount, teachersCount, groupsCount);

        return callAnthropic(systemPrompt, message);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private void checkApiKey() {
        if (apiKey == null || apiKey.isBlank() || "-".equals(apiKey)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "AI xizmati hozircha mavjud emas. Administrator bilan bog'laning.");
        }
    }

    private String callAnthropic(String systemPrompt, String userMessage) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "model", model,
                    "max_tokens", 1024,
                    "system", systemPrompt,
                    "messages", List.of(
                            Map.of("role", "user", "content", userMessage)
                    )
            ));

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.anthropic.com/v1/messages"))
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "AI xizmatida xatolik yuz berdi. Keyinroq urinib ko'ring.");
            }

            JsonNode root = objectMapper.readTree(response.body());
            return root.path("content").get(0).path("text").asText();

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "AI so'rovida xatolik: " + e.getMessage());
        }
    }

    private <T> T parseJson(String raw, Class<T> clazz) {
        try {
            // JSON ni matndan ajratib olish (Claude ba'zan ```json ... ``` ichida qaytaradi)
            String cleaned = raw.strip();
            int start = cleaned.indexOf('{');
            int end = cleaned.lastIndexOf('}');
            if (start >= 0 && end > start) {
                cleaned = cleaned.substring(start, end + 1);
            }
            return objectMapper.readValue(cleaned, clazz);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "AI javobini parse qilishda xatolik. Qayta urinib ko'ring.");
        }
    }
}
