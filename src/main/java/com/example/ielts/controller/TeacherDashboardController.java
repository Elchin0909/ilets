package com.example.ielts.controller;

import com.example.ielts.dto.dashboard.AttendanceTrendResponse;
import com.example.ielts.dto.dashboard.AvgExamScoreResponse;
import com.example.ielts.dto.dashboard.GroupAttendanceSummaryResponse;
import com.example.ielts.service.TeacherDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teacher/dashboard")
@RequiredArgsConstructor
public class TeacherDashboardController {

    private final TeacherDashboardService service;

    // A1) Group attendance %
    @GetMapping("/groups/{groupId}/attendance")
    @PreAuthorize("@guard.canAccessGroup(#groupId)")
    public GroupAttendanceSummaryResponse groupAttendance(
            @PathVariable UUID groupId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return service.groupAttendance(groupId, from, to);
    }

    // A3) Attendance trend (lesson_date -> present)
    @GetMapping("/groups/{groupId}/attendance-trend")
    @PreAuthorize("@guard.canAccessGroup(#groupId)")
    public AttendanceTrendResponse attendanceTrend(
            @PathVariable UUID groupId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return service.attendanceTrend(groupId, from, to);
    }

    // A2) Avg exam score (overall avg)
    @GetMapping("/groups/{groupId}/avg-exam-score")
    @PreAuthorize("@guard.canAccessGroup(#groupId)")
    public AvgExamScoreResponse avgExamScore(
            @PathVariable UUID groupId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return service.avgExamScore(groupId, from, to);
    }
}

