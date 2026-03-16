package com.example.ielts.repo;

import com.example.ielts.entity.HomeworkSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, UUID> {
    List<HomeworkSubmission> findByHomeworkId(UUID homeworkId);
    List<HomeworkSubmission> findByStudentId(UUID studentId);
    Optional<HomeworkSubmission> findByHomeworkIdAndStudentId(UUID homeworkId, UUID studentId);
    long countByHomeworkId(UUID homeworkId);
    long countByHomeworkIdAndStatus(UUID homeworkId, String status);
}
