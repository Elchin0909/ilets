package com.example.ielts.dto;

import java.util.UUID;

public class LowAttendanceDTO {
    private UUID studentId;
    private String fullName;
    private long totalLessons;
    private long presentCount;
    private double attendancePercent;

    public LowAttendanceDTO(UUID studentId, String fullName, long totalLessons, long presentCount) {
        this.studentId = studentId;
        this.fullName = fullName;
        this.totalLessons = totalLessons;
        this.presentCount = presentCount;
        this.attendancePercent = totalLessons > 0
                ? Math.round((presentCount * 100.0 / totalLessons) * 10.0) / 10.0
                : 0.0;
    }

    public UUID getStudentId() { return studentId; }
    public String getFullName() { return fullName; }
    public long getTotalLessons() { return totalLessons; }
    public long getPresentCount() { return presentCount; }
    public double getAttendancePercent() { return attendancePercent; }
}
