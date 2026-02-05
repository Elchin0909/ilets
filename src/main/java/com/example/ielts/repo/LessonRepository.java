package com.example.ielts.repo;

import com.example.ielts.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    // Group ichidagi darslar (oldindan bor edi)
    List<Lesson> findByGroupIdOrderByLessonDateAsc(UUID groupId);

    // ✅ AccessGuard uchun: lessonId -> groupId
    @Query("""
            select l.groupId
            from Lesson l
            where l.lessonId = :lessonId
           """)
    Optional<UUID> findGroupIdByLessonId(@Param("lessonId") UUID lessonId);

    // Dashboard uchun: date range ichida lesson count
    @Query("""
            select count(l)
            from Lesson l
            where l.groupId = :groupId
              and l.lessonDate >= :from
              and l.lessonDate <= :to
           """)
    long countLessons(@Param("groupId") UUID groupId,
                      @Param("from") LocalDate from,
                      @Param("to") LocalDate to);
}

