package com.example.ielts.repo;

import com.example.ielts.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
