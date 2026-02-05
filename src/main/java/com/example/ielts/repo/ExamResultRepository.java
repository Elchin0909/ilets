package com.example.ielts.repo;

import com.example.ielts.entity.ExamResult;
import com.example.ielts.entity.ExamResultId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ExamResultRepository extends JpaRepository<ExamResult, ExamResultId> {

    List<ExamResult> findByExamId(UUID examId);

    List<ExamResult> findByStudentId(UUID studentId);

    // ✅ Dashboard: avg OVERALL band
    @Query("""
            select avg(r.overall)
            from ExamResult r
            where r.examId in :examIds
              and r.studentId in :studentIds
           """)
    BigDecimal avgOverall(@Param("examIds") List<UUID> examIds,
                          @Param("studentIds") List<UUID> studentIds);

    // ✅ Dashboard: results count
    @Query("""
            select count(r)
            from ExamResult r
            where r.examId in :examIds
              and r.studentId in :studentIds
           """)
    long countResults(@Param("examIds") List<UUID> examIds,
                      @Param("studentIds") List<UUID> studentIds);
}
