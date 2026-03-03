package com.example.ielts.controller;

import com.example.ielts.dto.LessonCreateRequest;
import com.example.ielts.entity.Group;
import com.example.ielts.entity.Lesson;
import com.example.ielts.repo.GroupRepository;
import com.example.ielts.repo.LessonRepository;
import com.example.ielts.security.UserPrincipal;
import com.example.ielts.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService service;
    private final LessonRepository lessonRepo;
    private final GroupRepository groupRepo;

    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION','TEACHER')")
    @PostMapping
    public Lesson create(@RequestBody @Valid LessonCreateRequest req) {
        return service.create(req);
    }

    @PreAuthorize("@guard.canAccessGroup(#groupId)")
    @GetMapping("/by-group/{groupId}")
    public List<Lesson> byGroup(@PathVariable UUID groupId) {
        return service.byGroup(groupId);
    }

    @PreAuthorize("@guard.canAccessLesson(#id)")
    @PutMapping("/{id}")
    public Lesson update(@PathVariable UUID id, @RequestBody LessonCreateRequest req) {
        return service.update(id, req);
    }

    @PreAuthorize("@guard.canAccessLesson(#id)")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    // Bugungi darslar (dashboard uchun)
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','RECEPTION')")
    @GetMapping("/today")
    public List<Lesson> today() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal me = (auth != null && auth.getPrincipal() instanceof UserPrincipal p) ? p : null;

        LocalDate today = LocalDate.now();

        if (me != null && me.isTeacher() && me.getTeacherId() != null) {
            List<UUID> myGroupIds = groupRepo.findAllByTeacherId(me.getTeacherId())
                    .stream().map(Group::getGroupId).toList();
            if (myGroupIds.isEmpty()) return List.of();
            return lessonRepo.findTodayByGroupIds(today, myGroupIds);
        }

        return lessonRepo.findByLessonDate(today);
    }
}
