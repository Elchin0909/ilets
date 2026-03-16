package com.example.ielts.repo;

import com.example.ielts.entity.QuizStudentResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizStudentResultRepository extends JpaRepository<QuizStudentResult, UUID> {
    List<QuizStudentResult> findBySessionId(UUID sessionId);
    Optional<QuizStudentResult> findBySessionIdAndStudentId(UUID sessionId, UUID studentId);
    List<QuizStudentResult> findByStudentId(UUID studentId);
    List<QuizStudentResult> findByStudentIdOrderBySubmittedAtDesc(UUID studentId);
}
