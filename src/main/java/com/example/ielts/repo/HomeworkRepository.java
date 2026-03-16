package com.example.ielts.repo;

import com.example.ielts.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HomeworkRepository extends JpaRepository<Homework, UUID> {
    List<Homework> findByGroupIdOrderByCreatedAtDesc(UUID groupId);
    List<Homework> findByTeacherIdOrderByCreatedAtDesc(UUID teacherId);
    List<Homework> findAllByOrderByCreatedAtDesc();
}
