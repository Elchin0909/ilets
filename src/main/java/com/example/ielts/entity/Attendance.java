package com.example.ielts.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "attendance", schema = "app")
@IdClass(AttendanceId.class)
public class Attendance {

    @Id
    @Column(name = "lesson_id", nullable = false)
    private UUID lessonId;

    @Id
    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(name = "status", nullable = false, length = 10)
    private String status; // present | absent | late (DB check constraint bor)

    @Column(name = "comment")
    private String comment;

    public UUID getLessonId() { return lessonId; }
    public void setLessonId(UUID lessonId) { this.lessonId = lessonId; }

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
