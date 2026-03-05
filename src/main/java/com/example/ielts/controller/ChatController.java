package com.example.ielts.controller;

import com.example.ielts.dto.ChatMessageResponse;
import com.example.ielts.entity.ChatMessage;
import com.example.ielts.entity.Student;
import com.example.ielts.entity.Teacher;
import com.example.ielts.repo.ChatMessageRepository;
import com.example.ielts.repo.StudentRepository;
import com.example.ielts.repo.TeacherRepository;
import com.example.ielts.security.UserPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatMessageRepository chatRepo;
    private final StudentRepository studentRepo;
    private final TeacherRepository teacherRepo;

    public ChatController(ChatMessageRepository chatRepo,
                          StudentRepository studentRepo,
                          TeacherRepository teacherRepo) {
        this.chatRepo = chatRepo;
        this.studentRepo = studentRepo;
        this.teacherRepo = teacherRepo;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/group/{groupId}")
    public List<ChatMessageResponse> getMessages(@PathVariable UUID groupId,
                                                  @RequestParam(defaultValue = "100") int limit) {
        List<ChatMessage> msgs = chatRepo.findLastNByGroupId(groupId, limit);
        // reverse to get oldest first
        java.util.Collections.reverse(msgs);
        return msgs.stream().map(this::toDto).collect(Collectors.toList());
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/group/{groupId}")
    public ChatMessageResponse sendMessage(@PathVariable UUID groupId,
                                            @RequestBody Map<String, String> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth.getPrincipal() instanceof UserPrincipal p)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED);
        }

        String content = body.get("content");
        if (content == null || content.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, "Xabar bo'sh bo'lishi mumkin emas");
        }

        // Resolve display name
        String displayName = resolveDisplayName(p);

        ChatMessage msg = new ChatMessage();
        msg.setGroupId(groupId);
        msg.setSenderUsername(p.getUsername());
        msg.setSenderName(displayName);
        msg.setSenderRole(p.getRole());
        msg.setContent(content.trim());
        msg.setSentAt(LocalDateTime.now());

        return toDto(chatRepo.save(msg));
    }

    private String resolveDisplayName(UserPrincipal p) {
        if ("STUDENT".equals(p.getRole()) && p.getStudentId() != null) {
            return studentRepo.findById(p.getStudentId())
                    .map(Student::getFullName)
                    .orElse(p.getUsername());
        }
        if ("TEACHER".equals(p.getRole()) && p.getTeacherId() != null) {
            return teacherRepo.findById(p.getTeacherId())
                    .map(Teacher::getFullName)
                    .orElse(p.getUsername());
        }
        return p.getUsername(); // ADMIN
    }

    private ChatMessageResponse toDto(ChatMessage m) {
        ChatMessageResponse r = new ChatMessageResponse();
        r.messageId = m.getMessageId();
        r.groupId = m.getGroupId();
        r.senderUsername = m.getSenderUsername();
        r.senderName = m.getSenderName();
        r.senderRole = m.getSenderRole();
        r.content = m.getContent();
        r.sentAt = m.getSentAt();
        return r;
    }
}
