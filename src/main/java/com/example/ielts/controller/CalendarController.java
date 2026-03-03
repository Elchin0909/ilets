package com.example.ielts.controller;

import com.example.ielts.dto.CalendarEventDTO;
import com.example.ielts.entity.Exam;
import com.example.ielts.entity.Group;
import com.example.ielts.entity.Lesson;
import com.example.ielts.repo.ExamRepository;
import com.example.ielts.repo.GroupRepository;
import com.example.ielts.repo.LessonRepository;
import com.example.ielts.security.UserPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final LessonRepository lessonRepo;
    private final ExamRepository examRepo;
    private final GroupRepository groupRepo;

    public CalendarController(LessonRepository lessonRepo,
                               ExamRepository examRepo,
                               GroupRepository groupRepo) {
        this.lessonRepo = lessonRepo;
        this.examRepo = examRepo;
        this.groupRepo = groupRepo;
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER','RECEPTION')")
    @GetMapping
    public List<CalendarEventDTO> getEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        // Joriy foydalanuvchini aniqlash
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal me = (auth != null && auth.getPrincipal() instanceof UserPrincipal p) ? p : null;

        List<Group> groups;
        if (me != null && me.isTeacher() && me.getTeacherId() != null) {
            // Teacher faqat o'z guruhlarini ko'radi
            groups = groupRepo.findAllByTeacherId(me.getTeacherId());
        } else {
            groups = groupRepo.findAll();
        }

        // Group nomi map
        Map<UUID, String> groupNames = groups.stream()
                .collect(Collectors.toMap(Group::getGroupId, Group::getGroupName));
        List<UUID> groupIds = groups.stream().map(Group::getGroupId).toList();

        List<CalendarEventDTO> events = new ArrayList<>();

        // Darslar (lessons)
        for (UUID gId : groupIds) {
            List<Lesson> lessons = lessonRepo.findByGroupIdAndDateRange(gId, from, to);
            String groupName = groupNames.getOrDefault(gId, "Guruh");
            for (Lesson l : lessons) {
                events.add(new CalendarEventDTO(
                        l.getLessonId(),
                        "LESSON",
                        l.getLessonDate(),
                        l.getTopic() != null && !l.getTopic().isBlank() ? l.getTopic() : "Dars",
                        groupName,
                        gId
                ));
            }
        }

        // Imtihonlar (exams)
        for (UUID gId : groupIds) {
            List<Exam> exams = examRepo.findByGroupIdAndDateRange(gId, from, to);
            String groupName = groupNames.getOrDefault(gId, "Guruh");
            for (Exam e : exams) {
                events.add(new CalendarEventDTO(
                        e.getExamId(),
                        "EXAM",
                        e.getExamDate(),
                        e.getTitle(),
                        groupName,
                        gId
                ));
            }
        }

        events.sort(Comparator.comparing(CalendarEventDTO::getDate));
        return events;
    }
}
