package com.example.ielts.dto;

import java.util.List;
import java.util.UUID;

public class AttendanceBulkMarkRequest {
    public UUID lessonId;
    public List<Item> items;

    public static class Item {
        public UUID studentId;
        public String status;   // present | absent | late
        public String comment;
    }
}
