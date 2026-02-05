package com.example.ielts.entity;

import java.io.Serializable;
import java.util.UUID;

public class AttendanceId implements Serializable {

    private UUID lessonId;
    private UUID studentId;

    public AttendanceId() {}

    public AttendanceId(UUID lessonId, UUID studentId) {
        this.lessonId = lessonId;
        this.studentId = studentId;
    }

    public UUID getLessonId() { return lessonId; }
    public void setLessonId(UUID lessonId) { this.lessonId = lessonId; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    // Composite key uchun shart: equals + hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AttendanceId that)) return false;
        return lessonId.equals(that.lessonId) && studentId.equals(that.studentId);
    }

    @Override
    public int hashCode() {
        int result = lessonId.hashCode();
        result = 31 * result + studentId.hashCode();
        return result;
    }
}
