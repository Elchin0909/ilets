package com.example.ielts.dto.dashboard;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

public class AttendanceTrendResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID groupId;
    private List<AttendanceTrendPoint> points;

    public AttendanceTrendResponse() {}

    public AttendanceTrendResponse(UUID groupId, List<AttendanceTrendPoint> points) {
        this.groupId = groupId;
        this.points = points;
    }

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }

    public List<AttendanceTrendPoint> getPoints() { return points; }
    public void setPoints(List<AttendanceTrendPoint> points) { this.points = points; }
}
