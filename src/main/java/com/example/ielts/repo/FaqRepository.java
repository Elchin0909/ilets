package com.example.ielts.repo;

import com.example.ielts.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FaqRepository extends JpaRepository<Faq, UUID> {
    List<Faq> findAllByOrderBySortOrderAscCreatedAtAsc();
}
