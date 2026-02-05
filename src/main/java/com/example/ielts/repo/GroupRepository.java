package com.example.ielts.repo;

import com.example.ielts.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GroupRepository extends JpaRepository<Group, UUID> {

    boolean existsByGroupIdAndTeacherId(UUID groupId, UUID teacherId);

    List<Group> findAllByTeacherId(UUID teacherId);

    boolean existsByGroupNameIgnoreCase(String groupName);
}
