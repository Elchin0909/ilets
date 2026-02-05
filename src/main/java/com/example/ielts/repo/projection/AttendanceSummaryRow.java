package com.example.ielts.repo.projection;

public interface AttendanceSummaryRow {
    Long getTotalLessons();
    Long getPresentCount();
    Long getLateCount();
    Long getAbsentCount();
}
