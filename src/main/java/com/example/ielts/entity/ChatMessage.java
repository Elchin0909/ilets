package com.example.ielts.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_messages", schema = "app")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "message_id")
    private UUID messageId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "sender_username", nullable = false, length = 100)
    private String senderUsername;

    @Column(name = "sender_name", length = 200)
    private String senderName;

    @Column(name = "sender_role", length = 20)
    private String senderRole;

    /** TEXT | FILE | VOICE */
    @Column(name = "message_type", length = 10)
    private String messageType = "TEXT";

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "sent_at")
    private LocalDateTime sentAt = LocalDateTime.now();

    public UUID getMessageId()   { return messageId; }
    public UUID getGroupId()     { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public String getSenderUsername() { return senderUsername; }
    public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getContent()   { return content; }
    public void setContent(String content) { this.content = content; }
    public String getFileUrl()   { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getFileName()  { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
