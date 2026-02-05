package com.example.ielts.repo.projection;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class AttendanceSummaryResponse {
    public UUID groupId;
    public LocalDate from;
    public LocalDate to;

    public long totalLessons;
    public long presentCount;
    public long lateCount;
    public long absentCount;

    public BigDecimal attendancePercent; // 0..100
}
