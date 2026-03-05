package com.example.ielts.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ChatMessageResponse {
    public UUID messageId;
    public UUID groupId;
    public String senderUsername;
    public String senderName;
    public String senderRole;
    public String messageType;   // TEXT | FILE | VOICE
    public String content;
    public String fileUrl;
    public String fileName;
    public LocalDateTime sentAt;
}
