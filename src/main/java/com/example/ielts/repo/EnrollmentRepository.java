package com.example.ielts.repo;

import com.example.ielts.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    boolean existsByGroupIdAndStudentId(UUID groupId, UUID studentId);

    List<Enrollment> findByGroupId(UUID groupId);

    List<Enrollment> findByStudentId(UUID studentId);

    List<Enrollment> findByGroupIdAndStatus(UUID groupId, String status);

    // ✅ Dashboard uchun: ACTIVE studentlar soni
    @Query("""
            select count(e)
            from Enrollment e
            where e.groupId = :groupId
              and lower(e.status) = lower(:status)
           """)
    long countByGroupIdAndStatus(@Param("groupId") UUID groupId, @Param("status") String status);

    // ✅ Dashboard uchun: ACTIVE studentId lar ro'yxati
    @Query("""
            select e.studentId
            from Enrollment e
            where e.groupId = :groupId
              and lower(e.status) = lower(:status)
           """)
    List<UUID> findStudentIdsByGroupIdAndStatus(@Param("groupId") UUID groupId, @Param("status") String status);
}
