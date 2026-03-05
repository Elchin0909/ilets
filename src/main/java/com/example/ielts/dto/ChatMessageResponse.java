package com.example.ielts.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class ChatMessageResponse {
    public UUID messageId;
    public UUID groupId;
    public String senderUsername;
    public String senderName;
    public String senderRole;
    public String content;
    public LocalDateTime sentAt;
}
