package com.example.ielts.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class LessonCreateRequest {
    private UUID groupId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lessonDate;

    private String topic;
    private String notes;
    private String homework;
}
