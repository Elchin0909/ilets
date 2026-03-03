package com.example.ielts.repo;

import com.example.ielts.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    @Query("select e.groupId from Exam e where e.examId = :examId")
    Optional<UUID> findGroupIdByExamId(@Param("examId") UUID examId);

    List<Exam> findByGroupId(UUID groupId);

    // ✅ Dashboard uchun: date range bo'yicha examId lar
    @Query("""
            select e.examId
            from Exam e
            where e.groupId = :groupId
              and e.examDate >= :from
              and e.examDate <= :to
           """)
    List<UUID> findExamIds(@Param("groupId") UUID groupId,
                           @Param("from") LocalDate from,
                           @Param("to") LocalDate to);

    // ✅ Dashboard uchun: date range bo'yicha exam count
    @Query("""
            select count(e)
            from Exam e
            where e.groupId = :groupId
              and e.examDate >= :from
              and e.examDate <= :to
           """)
    long countExams(@Param("groupId") UUID groupId,
                    @Param("from") LocalDate from,
                    @Param("to") LocalDate to);

    // Calendar uchun: date range bo'yicha imtihonlar
    @Query("""
            select e from Exam e
            where e.groupId = :groupId
              and e.examDate >= :from
              and e.examDate <= :to
            order by e.examDate asc
           """)
    List<Exam> findByGroupIdAndDateRange(@Param("groupId") UUID groupId,
                                          @Param("from") LocalDate from,
                                          @Param("to") LocalDate to);
}
