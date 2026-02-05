package com.example.ielts.dto.dashboard;

import java.io.Serializable;
import java.time.LocalDate;

public class AttendanceTrendPoint implements Serializable {
    private static final long serialVersionUID = 1L;

    private LocalDate lessonDate;
    private long presentCount;
    private long expectedCount;
    private double attendancePercent;

    public AttendanceTrendPoint() {}

    public AttendanceTrendPoint(LocalDate lessonDate, long presentCount, long expectedCount, double attendancePercent) {
        this.lessonDate = lessonDate;
        this.presentCount = presentCount;
        this.expectedCount = expectedCount;
        this.attendancePercent = attendancePercent;
    }

    public LocalDate getLessonDate() { return lessonDate; }
    public void setLessonDate(LocalDate lessonDate) { this.lessonDate = lessonDate; }

    public long getPresentCount() { return presentCount; }
    public void setPresentCount(long presentCount) { this.presentCount = presentCount; }

    public long getExpectedCount() { return expectedCount; }
    public void setExpectedCount(long expectedCount) { this.expectedCount = expectedCount; }

    public double getAttendancePercent() { return attendancePercent; }
    public void setAttendancePercent(double attendancePercent) { this.attendancePercent = attendancePercent; }
}
