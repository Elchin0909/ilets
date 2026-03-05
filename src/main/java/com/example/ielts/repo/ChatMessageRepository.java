package com.example.ielts.repo;

import com.example.ielts.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    @Query("SELECT m FROM ChatMessage m WHERE m.groupId = :groupId ORDER BY m.sentAt ASC")
    List<ChatMessage> findByGroupIdOrderBySentAtAsc(@Param("groupId") UUID groupId);

    @Query(value = "SELECT * FROM app.chat_messages WHERE group_id = :groupId ORDER BY sent_at DESC LIMIT :limit", nativeQuery = true)
    List<ChatMessage> findLastNByGroupId(@Param("groupId") UUID groupId, @Param("limit") int limit);
}
