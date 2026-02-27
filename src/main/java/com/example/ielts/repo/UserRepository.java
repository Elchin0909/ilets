package com.example.ielts.repo;

import com.example.ielts.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    @Query(
            value = "select * from app.users where username = :username limit 1",
            nativeQuery = true
    )
    Optional<User> findByUsername(@Param("username") String username);

    @Query(
            value = "select exists(select 1 from app.users where username = :username)",
            nativeQuery = true
    )
    boolean existsByUsername(@Param("username") String username);

    @Query(
            value = "select * from app.users where teacher_id = :teacherId limit 1",
            nativeQuery = true
    )
    Optional<User> findByTeacherId(@Param("teacherId") UUID teacherId);

    @Query(
            value = "select * from app.users where student_id = :studentId limit 1",
            nativeQuery = true
    )
    Optional<User> findByStudentId(@Param("studentId") UUID studentId);

    @Query(
            value = "select * from app.users where role = 'STUDENT' and is_active = false order by created_at desc",
            nativeQuery = true
    )
    List<User> findPendingStudents();
}
