package com.example.ielts.dto.dashboard;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

public class GroupAttendanceSummaryResponse implements Serializable {
    private UUID groupId;
    private LocalDate from;
    private LocalDate to;

    private long presentCount;
    private long expectedCount;
    private double attendancePercent;

    public GroupAttendanceSummaryResponse() {}

    public GroupAttendanceSummaryResponse(UUID groupId, LocalDate from, LocalDate to,
                                          long presentCount, long expectedCount, double attendancePercent) {
        this.groupId = groupId;
        this.from = from;
        this.to = to;
        this.presentCount = presentCount;
        this.expectedCount = expectedCount;
        this.attendancePercent = attendancePercent;
    }

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }

    public LocalDate getFrom() { return from; }
    public void setFrom(LocalDate from) { this.from = from; }

    public LocalDate getTo() { return to; }
    public void setTo(LocalDate to) { this.to = to; }

    public long getPresentCount() { return presentCount; }
    public void setPresentCount(long presentCount) { this.presentCount = presentCount; }

    public long getExpectedCount() { return expectedCount; }
    public void setExpectedCount(long expectedCount) { this.expectedCount = expectedCount; }

    public double getAttendancePercent() { return attendancePercent; }
    public void setAttendancePercent(double attendancePercent) { this.attendancePercent = attendancePercent; }
}
