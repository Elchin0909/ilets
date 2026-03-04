package com.example.ielts.repo;

import com.example.ielts.entity.QuizTest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuizTestRepository extends JpaRepository<QuizTest, UUID> {
    List<QuizTest> findByTeacherId(UUID teacherId);
    List<QuizTest> findByApproved(boolean approved);
    List<QuizTest> findAllByOrderByCreatedAtDesc();
}
