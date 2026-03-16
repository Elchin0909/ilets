package com.example.ielts.repo;

import com.example.ielts.entity.TeacherRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeacherRatingRepository extends JpaRepository<TeacherRating, UUID> {
    List<TeacherRating> findByTeacherIdOrderByCreatedAtDesc(UUID teacherId);
    Optional<TeacherRating> findByTeacherIdAndStudentId(UUID teacherId, UUID studentId);

    @Query("SELECT AVG(r.rating) FROM TeacherRating r WHERE r.teacherId = ?1")
    Double avgRatingByTeacherId(UUID teacherId);

    long countByTeacherId(UUID teacherId);
}
