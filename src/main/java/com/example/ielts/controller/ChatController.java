package com.example.ielts.controller;

import com.example.ielts.dto.ChatMessageResponse;
import com.example.ielts.entity.ChatMessage;
import com.example.ielts.entity.Student;
import com.example.ielts.entity.Teacher;
import com.example.ielts.repo.ChatMessageRepository;
import com.example.ielts.repo.EnrollmentRepository;
import com.example.ielts.repo.GroupRepository;
import com.example.ielts.repo.StudentRepository;
import com.example.ielts.repo.TeacherRepository;
import com.example.ielts.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024L; // 50 MB

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav",
            "video/webm", "video/mp4"
    );

    private final ChatMessageRepository chatRepo;
    private final StudentRepository     studentRepo;
    private final TeacherRepository     teacherRepo;
    private final EnrollmentRepository  enrollmentRepo;
    private final GroupRepository       groupRepo;

    public ChatController(ChatMessageRepository chatRepo,
                          StudentRepository studentRepo,
                          TeacherRepository teacherRepo,
                          EnrollmentRepository enrollmentRepo,
                          GroupRepository groupRepo) {
        this.chatRepo       = chatRepo;
        this.studentRepo    = studentRepo;
        this.teacherRepo    = teacherRepo;
        this.enrollmentRepo = enrollmentRepo;
        this.groupRepo      = groupRepo;
    }

    // ── GET messages ──────────────────────────────────────────────────────────

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/group/{groupId}")
    public List<ChatMessageResponse> getMessages(@PathVariable UUID groupId,
                                                  @RequestParam(defaultValue = "100") int limit) {
        UserPrincipal p = principal();
        checkAccess(p, groupId);
        List<ChatMessage> msgs = chatRepo.findLastNByGroupId(groupId, limit);
        java.util.Collections.reverse(msgs); // oldest first
        return msgs.stream().map(this::toDto).collect(Collectors.toList());
    }

    // ── POST text message ─────────────────────────────────────────────────────

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/group/{groupId}")
    public ChatMessageResponse sendText(@PathVariable UUID groupId,
                                         @RequestBody Map<String, String> body) {
        UserPrincipal p = principal();
        checkAccess(p, groupId);

        String content = body.get("content");
        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Xabar bo'sh bo'lishi mumkin emas");
        }

        ChatMessage msg = buildBase(p, groupId);
        msg.setMessageType("TEXT");
        msg.setContent(content.trim());
        return toDto(chatRepo.save(msg));
    }

    // ── POST file / voice (ADMIN + TEACHER only) ──────────────────────────────

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping(value = "/group/{groupId}/file", consumes = "multipart/form-data")
    public ChatMessageResponse sendFile(@PathVariable UUID groupId,
                                         @RequestParam("file") MultipartFile file,
                                         @RequestParam(value = "messageType", defaultValue = "FILE") String messageType) {
        UserPrincipal p = principal();
        checkAccess(p, groupId);

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fayl bo'sh");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fayl 50 MB dan oshmasligi kerak");
        }
        String ct = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        if (!ALLOWED_TYPES.contains(ct)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Bu turdagi fayl qabul qilinmaydi: " + ct);
        }

        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String ext      = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String saved    = UUID.randomUUID() + ext;
        // toAbsolutePath() ensures relative paths are resolved from user.dir, not Tomcat's work dir
        Path   dir      = Paths.get(uploadDir, "chat").toAbsolutePath().normalize();
        Path   target   = dir.resolve(saved);

        try {
            Files.createDirectories(dir);
            try (java.io.InputStream in = file.getInputStream()) {
                Files.copy(in, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fayl saqlashda xatolik: " + e.getMessage());
        }

        String type = "VOICE".equalsIgnoreCase(messageType) ? "VOICE" : "FILE";
        ChatMessage msg = buildBase(p, groupId);
        msg.setMessageType(type);
        msg.setFileUrl("/uploads/chat/" + saved);
        msg.setFileName(original);
        msg.setContent(original);
        return toDto(chatRepo.save(msg));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private UserPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth.getPrincipal() instanceof UserPrincipal up)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return up;
    }

    private void checkAccess(UserPrincipal p, UUID groupId) {
        if ("ADMIN".equals(p.getRole())) return;
        if ("TEACHER".equals(p.getRole()) && p.getTeacherId() != null) {
            if (!groupRepo.existsByGroupIdAndTeacherId(groupId, p.getTeacherId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu guruh chatiga ruxsatiz");
            }
            return;
        }
        if ("STUDENT".equals(p.getRole()) && p.getStudentId() != null) {
            if (!enrollmentRepo.existsByGroupIdAndStudentId(groupId, p.getStudentId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu guruh chatiga ruxsatiz");
            }
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    private ChatMessage buildBase(UserPrincipal p, UUID groupId) {
        ChatMessage msg = new ChatMessage();
        msg.setGroupId(groupId);
        msg.setSenderUsername(p.getUsername());
        msg.setSenderName(resolveDisplayName(p));
        msg.setSenderRole(p.getRole());
        msg.setSentAt(LocalDateTime.now());
        return msg;
    }

    private String resolveDisplayName(UserPrincipal p) {
        if ("STUDENT".equals(p.getRole()) && p.getStudentId() != null) {
            return studentRepo.findById(p.getStudentId())
                    .map(Student::getFullName).orElse(p.getUsername());
        }
        if ("TEACHER".equals(p.getRole()) && p.getTeacherId() != null) {
            return teacherRepo.findById(p.getTeacherId())
                    .map(Teacher::getFullName).orElse(p.getUsername());
        }
        return p.getUsername();
    }

    private ChatMessageResponse toDto(ChatMessage m) {
        ChatMessageResponse r = new ChatMessageResponse();
        r.messageId      = m.getMessageId();
        r.groupId        = m.getGroupId();
        r.senderUsername = m.getSenderUsername();
        r.senderName     = m.getSenderName();
        r.senderRole     = m.getSenderRole();
        r.messageType    = m.getMessageType() != null ? m.getMessageType() : "TEXT";
        r.content        = m.getContent();
        r.fileUrl        = m.getFileUrl();
        r.fileName       = m.getFileName();
        r.sentAt         = m.getSentAt();
        return r;
    }
}
