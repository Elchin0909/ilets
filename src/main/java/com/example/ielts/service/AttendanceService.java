package com.example.ielts.service;

import com.example.ielts.dto.AttendanceBulkMarkRequest;
import com.example.ielts.dto.AttendanceMarkRequest;
import com.example.ielts.dto.AttendanceResponse;
import com.example.ielts.entity.Attendance;
import com.example.ielts.entity.Lesson;
import com.example.ielts.repo.AttendanceRepository;
import com.example.ielts.repo.LessonRepository;
import com.example.ielts.repo.StudentRepository;
import com.example.ielts.repo.projection.AttendanceRowView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepo;
    private final LessonRepository lessonRepo;
    private final StudentRepository studentRepo;

    public AttendanceService(AttendanceRepository attendanceRepo,
                             LessonRepository lessonRepo,
                             StudentRepository studentRepo) {
        this.attendanceRepo = attendanceRepo;
        this.lessonRepo = lessonRepo;
        this.studentRepo = studentRepo;
    }

    // =========================
    // LIST BY LESSON (AUTO INIT)
    // =========================
    @Transactional
    public List<AttendanceResponse> byLesson(UUID lessonId) {
        requireLesson(lessonId);

        // auto-init: groupdagi active studentlarni absent qilib qo'shib qo'yadi
        attendanceRepo.initForLesson(lessonId);

        // ro'yxatni student full_name bilan qaytaramiz
        List<AttendanceRowView> rows = attendanceRepo.rowsByLesson(lessonId);

        return rows.stream().map(v -> {
            AttendanceResponse r = new AttendanceResponse();
            r.lessonId = v.getLessonId();
            r.studentId = v.getStudentId();
            r.fullName = v.getFullName();
            r.status = v.getStatus();
            r.comment = v.getComment();
            return r;
        }).toList();
    }

    // =========================
    // LIST BY STUDENT
    // =========================
    public List<AttendanceResponse> byStudent(UUID studentId) {
        requireStudent(studentId);

        return attendanceRepo.findByStudentId(studentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================
    // MARK SINGLE (UPSERT)
    // =========================
    @Transactional
    public AttendanceResponse mark(AttendanceMarkRequest req) {
        if (req == null) throw new RuntimeException("Request is null");
        if (req.lessonId == null) throw new RuntimeException("lessonId is required");
        if (req.studentId == null) throw new RuntimeException("studentId is required");
        if (req.status == null) throw new RuntimeException("status is required");

        requireLesson(req.lessonId);
        requireStudent(req.studentId);

        String normalizedStatus = normalizeStatus(req.status);

        Attendance a = new Attendance();
        a.setLessonId(req.lessonId);
        a.setStudentId(req.studentId);
        a.setStatus(normalizedStatus);
        a.setComment(req.comment);

        return toResponse(attendanceRepo.save(a));
    }

    // =========================
    // MARK BULK (RECOMMENDED)
    // =========================
    @Transactional
    public void markBulk(AttendanceBulkMarkRequest req) {
        if (req == null) throw new RuntimeException("Request is null");
        if (req.lessonId == null) throw new RuntimeException("lessonId is required");
        if (req.items == null || req.items.isEmpty()) return;

        requireLesson(req.lessonId);

        // teacher init bosmasa ham: auto-init
        attendanceRepo.initForLesson(req.lessonId);

        for (AttendanceBulkMarkRequest.Item item : req.items) {
            if (item == null) continue;

            if (item.studentId == null) {
                throw new RuntimeException("studentId is required");
            }
            if (item.status == null) {
                throw new RuntimeException("status is required");
            }

            requireStudent(item.studentId);

            String normalizedStatus = normalizeStatus(item.status);

            Attendance a = new Attendance();
            a.setLessonId(req.lessonId);
            a.setStudentId(item.studentId);
            a.setStatus(normalizedStatus);
            a.setComment(item.comment);

            // composite PK -> update
            attendanceRepo.save(a);
        }
    }

    // =========================
    // PERCENT: STUDENT (FAST)
    // =========================
    public double studentPercent(UUID studentId) {
        requireStudent(studentId);

        Object[] stats = attendanceRepo.studentStats(studentId);
        if (stats == null || stats.length < 2) return 0.0;

        long total = stats[0] == null ? 0L : ((Number) stats[0]).longValue();
        long present = stats[1] == null ? 0L : ((Number) stats[1]).longValue();

        if (total == 0L) return 0.0;
        return present * 100.0 / total;
    }

    // =========================
    // PERCENT: GROUP
    // =========================
    public double groupPercent(UUID groupId) {
        List<Lesson> lessons = lessonRepo.findByGroupIdOrderByLessonDateAsc(groupId);
        if (lessons.isEmpty()) return 0.0;

        long total = 0;
        long present = 0;

        for (Lesson l : lessons) {
            List<Attendance> aList = attendanceRepo.findByLessonId(l.getLessonId());
            total += aList.size();
            present += aList.stream().filter(a -> "present".equals(a.getStatus())).count();
        }

        if (total == 0) return 0.0;
        return present * 100.0 / total;
    }

    // =========================
    // HELPERS
    // =========================
    private void requireLesson(UUID lessonId) {
        if (lessonId == null) throw new RuntimeException("lessonId is required");
        if (!lessonRepo.existsById(lessonId)) throw new RuntimeException("Lesson not found");
    }

    private void requireStudent(UUID studentId) {
        if (studentId == null) throw new RuntimeException("studentId is required");
        if (!studentRepo.existsById(studentId)) throw new RuntimeException("Student not found");
    }

    private String normalizeStatus(String status) {
        String s = status.trim().toLowerCase();
        if (!s.equals("present") && !s.equals("absent") && !s.equals("late")) {
            throw new RuntimeException("Invalid status. Use: present | absent | late");
        }
        return s;
    }

    // =========================
    // MAPPER
    // =========================
    private AttendanceResponse toResponse(Attendance a) {
        AttendanceResponse r = new AttendanceResponse();
        r.lessonId = a.getLessonId();
        r.studentId = a.getStudentId();
        r.fullName = null; // byLesson()da join bilan keladi
        r.status = a.getStatus();
        r.comment = a.getComment();
        return r;
    }
}
