package com.example.ielts.repo;

import com.example.ielts.entity.Attendance;
import com.example.ielts.entity.AttendanceId;
import com.example.ielts.repo.projection.AttendanceRowView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, AttendanceId> {

    // ===============================
    // BASIC QUERIES
    // ===============================
    List<Attendance> findByLessonId(UUID lessonId);

    List<Attendance> findByStudentId(UUID studentId);

    // Student statistikasi (present count + total)
    @Query("""
        select
            count(a) as total,
            sum(case when a.status = 'present' then 1 else 0 end)
        from Attendance a
        where a.studentId = :studentId
    """)
    Object[] studentStats(@Param("studentId") UUID studentId);

    // ===============================
    // AUTO INIT (LESSON -> ATTENDANCE)
    // ===============================
    @Modifying
    @Query(value = """
        INSERT INTO app.attendance (lesson_id, student_id, status)
        SELECT :lessonId, e.student_id, 'absent'
        FROM app.enrollments e
        JOIN app.lessons l ON l.group_id = e.group_id
        WHERE l.lesson_id = :lessonId
          AND e.status = 'active'
        ON CONFLICT (lesson_id, student_id) DO NOTHING
        """, nativeQuery = true)
    int initForLesson(@Param("lessonId") UUID lessonId);

    // ===============================
    // ATTENDANCE LIST (STUDENT NAME)
    // ===============================
    @Query(value = """
        SELECT
          a.lesson_id    AS lessonId,
          a.student_id   AS studentId,
          s.full_name    AS fullName,
          a.status       AS status,
          a.comment      AS comment,
          l.lesson_date  AS lessonDate
        FROM app.attendance a
        JOIN app.students s ON s.student_id = a.student_id
        JOIN app.lessons  l ON l.lesson_id  = a.lesson_id
        WHERE a.lesson_id = :lessonId
        ORDER BY s.full_name
        """, nativeQuery = true)
    List<AttendanceRowView> rowsByLesson(@Param("lessonId") UUID lessonId);

    @Query(value = """
        SELECT
          a.lesson_id    AS lessonId,
          a.student_id   AS studentId,
          s.full_name    AS fullName,
          a.status       AS status,
          a.comment      AS comment,
          l.lesson_date  AS lessonDate
        FROM app.attendance a
        JOIN app.students s ON s.student_id = a.student_id
        JOIN app.lessons  l ON l.lesson_id  = a.lesson_id
        WHERE a.student_id = :studentId
        ORDER BY l.lesson_date DESC
        """, nativeQuery = true)
    List<AttendanceRowView> rowsByStudent(@Param("studentId") UUID studentId);

    // ===============================
    // DASHBOARD: GROUP ATTENDANCE %
    // ===============================
    @Query(value = """
        SELECT count(*)
        FROM app.attendance a
        JOIN app.lessons l ON l.lesson_id = a.lesson_id
        WHERE l.group_id = :groupId
          AND l.lesson_date >= :from
          AND l.lesson_date <= :to
          AND a.status = ANY(:statuses)
        """, nativeQuery = true)
    long countPresentLike(@Param("groupId") UUID groupId,
                          @Param("from") LocalDate from,
                          @Param("to") LocalDate to,
                          @Param("statuses") String[] statuses);

    // ===============================
// DASHBOARD: TREND (lesson_date -> present count)
// returns: [lesson_date, lesson_count, present_count]
// ===============================
    @Query(value = """
    SELECT
      l.lesson_date AS lessonDate,
      count(distinct l.lesson_id) AS lessonCount,
      COALESCE(count(a.student_id), 0) AS presentCount
    FROM app.lessons l
    LEFT JOIN app.attendance a
      ON a.lesson_id = l.lesson_id
     AND a.status = ANY(:statuses)
    WHERE l.group_id = :groupId
      AND l.lesson_date >= :from
      AND l.lesson_date <= :to
    GROUP BY l.lesson_date
    ORDER BY l.lesson_date
    """, nativeQuery = true)
    List<Object[]> presentCountByLessonDate(@Param("groupId") UUID groupId,
                                            @Param("from") LocalDate from,
                                            @Param("to") LocalDate to,
                                            @Param("statuses") String[] statuses);

    // ===============================
    // LOW ATTENDANCE: talabalar < threshold%
    // ===============================
    @Query(value = """
        SELECT
            s.student_id AS studentId,
            s.full_name  AS fullName,
            COUNT(a.student_id) AS totalLessons,
            COALESCE(SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END), 0) AS presentCount
        FROM app.students s
        JOIN app.enrollments e ON e.student_id = s.student_id AND e.status = 'active'
        JOIN app.lessons l ON l.group_id = e.group_id AND l.lesson_date <= CURRENT_DATE
        LEFT JOIN app.attendance a ON a.lesson_id = l.lesson_id AND a.student_id = s.student_id
        GROUP BY s.student_id, s.full_name
        HAVING COUNT(a.student_id) >= 3
           AND (COALESCE(SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END), 0) * 100.0
               / NULLIF(COUNT(a.student_id), 0)) < :threshold
        ORDER BY (COALESCE(SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END), 0) * 100.0
               / NULLIF(COUNT(a.student_id), 0)) ASC
        LIMIT 20
    """, nativeQuery = true)
    List<Object[]> findLowAttendanceStudents(@Param("threshold") int threshold);

}
