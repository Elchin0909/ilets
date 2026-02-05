package com.example.ielts.service;

import com.example.ielts.dto.dashboard.AttendanceTrendPoint;
import com.example.ielts.dto.dashboard.AttendanceTrendResponse;
import com.example.ielts.dto.dashboard.AvgExamScoreResponse;
import com.example.ielts.dto.dashboard.GroupAttendanceSummaryResponse;
import com.example.ielts.repo.AttendanceRepository;
import com.example.ielts.repo.EnrollmentRepository;
import com.example.ielts.repo.ExamRepository;
import com.example.ielts.repo.ExamResultRepository;
import com.example.ielts.repo.LessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeacherDashboardService {

    private final EnrollmentRepository enrollmentRepo;
    private final LessonRepository lessonRepo;
    private final AttendanceRepository attendanceRepo;

    private final ExamRepository examRepo;
    private final ExamResultRepository examResultRepo;

    // DB'ingda statuslar lowercase edi (attendance init query: 'active', 'absent', 'present')
    private static final String ENROLLMENT_ACTIVE = "active";
    private static final String[] PRESENT_LIKE = {"present"}; // agar sende 'late' bor bo'lsa: {"present","late"}

    // =========================
    // A1) Group attendance %
    // =========================
    @Cacheable(
            value = "dash:group-attendance",
            key = "#groupId + ':' + #from + ':' + #to"
    )
    public GroupAttendanceSummaryResponse groupAttendance(UUID groupId, LocalDate from, LocalDate to) {

        long activeStudents = enrollmentRepo.countByGroupIdAndStatus(groupId, ENROLLMENT_ACTIVE);
        long lessonCount = lessonRepo.countLessons(groupId, from, to);

        long expected = activeStudents * lessonCount;

        long present = 0;
        if (expected > 0) {
            present = attendanceRepo.countPresentLike(groupId, from, to, PRESENT_LIKE);
        }

        double percent = expected == 0 ? 0.0 : (present * 100.0 / expected);
        percent = Math.round(percent * 100.0) / 100.0;

        return new GroupAttendanceSummaryResponse(groupId, from, to, present, expected, percent);
    }

    // =========================
    // A3) Progress trend (lesson -> attendance)
    // =========================
    @Cacheable(
            value = "dash:attendance-trend",
            key = "#groupId + ':' + #from + ':' + #to"
    )
    public AttendanceTrendResponse attendanceTrend(UUID groupId, LocalDate from, LocalDate to) {

        // 0) basic guard (bo'lmasa ham ishlaydi, lekin chiroyli)
        if (from == null || to == null) {
            return new AttendanceTrendResponse(groupId, List.of());
        }
        if (from.isAfter(to)) {
            return new AttendanceTrendResponse(groupId, List.of());
        }

        long activeStudents = enrollmentRepo.countByGroupIdAndStatus(groupId, ENROLLMENT_ACTIVE);

        // 1) repo ba’zan null qaytarishi mumkin — shuni “0 rows” deb qabul qilamiz
        List<Object[]> rows = attendanceRepo.presentCountByLessonDate(groupId, from, to, PRESENT_LIKE);
        if (rows == null || rows.isEmpty()) {
            return new AttendanceTrendResponse(groupId, List.of());
        }

        List<AttendanceTrendPoint> points = new ArrayList<>(rows.size());

        for (Object[] r : rows) {
            // native query: lessonDate, lessonCount, presentCount

            // lessonDate ba’zan java.sql.Date bo’lishi mumkin. Shunga tolerant qilamiz.
            LocalDate lessonDate = null;
            Object dateObj = r[0];
            if (dateObj instanceof LocalDate d) {
                lessonDate = d;
            } else if (dateObj instanceof java.sql.Date sd) {
                lessonDate = sd.toLocalDate();
            } else if (dateObj != null) {
                lessonDate = LocalDate.parse(dateObj.toString());
            }

            long lessonCount = toLong(r[1]);
            long present = toLong(r[2]);

            long expected = activeStudents * lessonCount;
            double percent = expected == 0 ? 0.0 : (present * 100.0 / expected);
            percent = Math.round(percent * 100.0) / 100.0;

            points.add(new AttendanceTrendPoint(lessonDate, present, expected, percent));
        }

        return new AttendanceTrendResponse(groupId, points);
    }

    // kichkina helper: Object -> long
    private long toLong(Object obj) {
        if (obj == null) return 0L;
        if (obj instanceof Number n) return n.longValue();
        return Long.parseLong(obj.toString());
    }


    // =========================
    // A2) Avg exam score (overall avg)
    // =========================
    @Cacheable(
            value = "dash:avg-exam",
            key = "#groupId + ':' + #from + ':' + #to"
    )
    public AvgExamScoreResponse avgExamScore(UUID groupId, LocalDate from, LocalDate to) {

        List<UUID> studentIds = enrollmentRepo.findStudentIdsByGroupIdAndStatus(groupId, ENROLLMENT_ACTIVE);
        long examCount = examRepo.countExams(groupId, from, to);

        if (studentIds.isEmpty() || examCount == 0) {
            return new AvgExamScoreResponse(groupId, from, to, null, examCount, 0);
        }

        List<UUID> examIds = examRepo.findExamIds(groupId, from, to);
        if (examIds.isEmpty()) {
            return new AvgExamScoreResponse(groupId, from, to, null, examCount, 0);
        }

        BigDecimal avgBd = examResultRepo.avgOverall(examIds, studentIds);
        long resultsCount = examResultRepo.countResults(examIds, studentIds);

        Double avg = null;
        if (avgBd != null) {
            avg = avgBd.setScale(2, RoundingMode.HALF_UP).doubleValue();
        }

        return new AvgExamScoreResponse(groupId, from, to, avg, examCount, resultsCount);
    }
}
