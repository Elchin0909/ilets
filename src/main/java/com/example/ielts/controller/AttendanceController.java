package com.example.ielts.controller;

import com.example.ielts.dto.AttendanceBulkMarkRequest;
import com.example.ielts.dto.AttendanceMarkRequest;
import com.example.ielts.dto.AttendanceResponse;
import com.example.ielts.dto.LowAttendanceDTO;
import com.example.ielts.service.AttendanceService;
import com.example.ielts.service.AuditLogService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService service;
    private final AuditLogService audit;

    public AttendanceController(AttendanceService service, AuditLogService audit) {
        this.service = service;
        this.audit = audit;
    }

    // Mark or update attendance (single)
    // Teacher faqat o'z lessonida mark qila oladi
    @PreAuthorize("@guard.canAccessLesson(#req.lessonId)")
    @PostMapping
    public AttendanceResponse mark(@RequestBody @Valid AttendanceMarkRequest req) {
        AttendanceResponse res = service.mark(req);
        audit.log("ATTENDANCE_MARK", req.lessonId);
        return res;
    }

    // List by lesson (AUTO INIT + fullName)
    @PreAuthorize("@guard.canAccessLesson(#lessonId)")
    @GetMapping("/by-lesson/{lessonId}")
    public List<AttendanceResponse> byLesson(@PathVariable UUID lessonId) {
        return service.byLesson(lessonId);
    }

    // List by student (ADMIN/RECEPTION)
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @GetMapping("/by-student/{studentId}")
    public List<AttendanceResponse> byStudent(@PathVariable UUID studentId) {
        return service.byStudent(studentId);
    }

    // Student attendance percent (ADMIN/RECEPTION)
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @GetMapping("/student/{studentId}/percent")
    public double studentPercent(@PathVariable UUID studentId) {
        return service.studentPercent(studentId);
    }

    // Group attendance percent
    @PreAuthorize("@guard.canAccessGroup(#groupId)")
    @GetMapping("/group/{groupId}/percent")
    public double groupPercent(@PathVariable UUID groupId) {
        return service.groupPercent(groupId);
    }

    // Bulk mark attendance for a lesson
    @PreAuthorize("@guard.canAccessLesson(#lessonId)")
    @PostMapping("/by-lesson/{lessonId}/bulk")
    public void markBulk(@PathVariable UUID lessonId,
                         @RequestBody @Valid AttendanceBulkMarkRequest req) {
        req.lessonId = lessonId;
        service.markBulk(req);
        audit.log("ATTENDANCE_BULK_MARK", lessonId);
    }

    // Low attendance students (ADMIN/RECEPTION)
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @GetMapping("/low-attendance")
    public List<LowAttendanceDTO> lowAttendance(
            @RequestParam(defaultValue = "75") int threshold) {
        return service.getLowAttendanceStudents(threshold);
    }
}
