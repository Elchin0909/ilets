package com.example.ielts.repo;

import com.example.ielts.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResourceRepository extends JpaRepository<Resource, UUID> {
    List<Resource> findByCategoryOrderByCreatedAtDesc(String category);
    List<Resource> findAllByOrderByCreatedAtDesc();
}
