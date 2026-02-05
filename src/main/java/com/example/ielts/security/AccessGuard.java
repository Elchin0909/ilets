package com.example.ielts.security;

import com.example.ielts.repo.ExamRepository;
import com.example.ielts.repo.GroupRepository;
import com.example.ielts.repo.LessonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component("guard")
public class AccessGuard {

    private final GroupRepository groupRepo;
    private final LessonRepository lessonRepo;
    private final ExamRepository examRepo;

    public AccessGuard(GroupRepository groupRepo, LessonRepository lessonRepo, ExamRepository examRepo) {
        this.groupRepo = groupRepo;
        this.lessonRepo = lessonRepo;
        this.examRepo = examRepo;
    }

    private UserPrincipal principal() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || a.getPrincipal() == null || !(a.getPrincipal() instanceof UserPrincipal p)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return (UserPrincipal) a.getPrincipal();
    }

    public boolean canAccessGroup(UUID groupId) {
        if (groupId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "groupId is required");
        }

        UserPrincipal p = principal();
        if (p.isAdmin()) return true;

        if (!p.isTeacher() || p.getTeacherId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        boolean exists = groupRepo.existsById(groupId);
        if (!exists) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }

        boolean ok = groupRepo.existsByGroupIdAndTeacherId(groupId, p.getTeacherId());
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this group");
        }
        return true;
    }

    public boolean canAccessLesson(UUID lessonId) {
        if (lessonId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lessonId is required");
        }

        UUID groupId = lessonRepo.findGroupIdByLessonId(lessonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

        return canAccessGroup(groupId);
    }

    public boolean canAccessExam(UUID examId) {
        if (examId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "examId is required");
        }

        UUID groupId = examRepo.findGroupIdByExamId(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        return canAccessGroup(groupId);
    }

    // eski void wrapperlar (qolsa ham mayli)
    public void requireOwnsGroup(UUID groupId) { canAccessGroup(groupId); }
    public void requireOwnsLesson(UUID lessonId) { canAccessLesson(lessonId); }
    public void requireOwnsExam(UUID examId) { canAccessExam(examId); }
}
