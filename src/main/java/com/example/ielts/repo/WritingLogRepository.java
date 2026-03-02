package com.example.ielts.repo;

import com.example.ielts.entity.WritingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface WritingLogRepository extends JpaRepository<WritingLog, UUID> {

    List<WritingLog> findAllByOrderByCreatedAtDesc();

    List<WritingLog> findByStudentIdOrderByCreatedAtDesc(UUID studentId);

    @Query("SELECT w.level, COUNT(w) FROM WritingLog w GROUP BY w.level")
    List<Object[]> countByLevel();

    @Query("SELECT w.taskType, COUNT(w) FROM WritingLog w GROUP BY w.taskType")
    List<Object[]> countByTaskType();
}
