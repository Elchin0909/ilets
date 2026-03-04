package com.example.ielts.repo;

import com.example.ielts.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {
    List<QuizQuestion> findByTestIdOrderByOrderIndex(UUID testId);

    @Transactional
    void deleteByTestId(UUID testId);

    long countByTestId(UUID testId);
}
