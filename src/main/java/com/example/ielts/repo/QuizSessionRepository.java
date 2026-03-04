package com.example.ielts.repo;

import com.example.ielts.entity.QuizSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuizSessionRepository extends JpaRepository<QuizSession, UUID> {
    List<QuizSession> findByGroupId(UUID groupId);
    List<QuizSession> findByStatus(String status);
    List<QuizSession> findByGroupIdAndStatus(UUID groupId, String status);
    List<QuizSession> findByGroupIdIn(List<UUID> groupIds);
}
