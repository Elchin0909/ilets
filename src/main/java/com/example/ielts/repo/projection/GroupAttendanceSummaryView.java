package com.example.ielts.repo.projection;

public interface GroupAttendanceSummaryView {
    Long getTotalLessons();
    Long getPresentCount();
    Long getLateCount();
    Long getAbsentCount();
}
