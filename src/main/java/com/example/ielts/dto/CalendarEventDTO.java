package com.example.ielts.dto;

import java.time.LocalDate;
import java.util.UUID;

public class CalendarEventDTO {
    private UUID id;
    private String type;   // "LESSON" | "EXAM"
    private LocalDate date;
    private String title;
    private String groupName;
    private UUID groupId;

    public CalendarEventDTO() {}

    public CalendarEventDTO(UUID id, String type, LocalDate date, String title, String groupName, UUID groupId) {
        this.id = id;
        this.type = type;
        this.date = date;
        this.title = title;
        this.groupName = groupName;
        this.groupId = groupId;
    }

    public UUID getId() { return id; }
    public String getType() { return type; }
    public LocalDate getDate() { return date; }
    public String getTitle() { return title; }
    public String getGroupName() { return groupName; }
    public UUID getGroupId() { return groupId; }
}
