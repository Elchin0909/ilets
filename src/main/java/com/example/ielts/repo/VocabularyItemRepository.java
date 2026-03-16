package com.example.ielts.repo;

import com.example.ielts.entity.VocabularyItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VocabularyItemRepository extends JpaRepository<VocabularyItem, UUID> {
    List<VocabularyItem> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
}
