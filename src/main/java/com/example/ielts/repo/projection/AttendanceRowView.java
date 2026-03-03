package com.example.ielts.repo.projection;

import java.util.UUID;

public interface AttendanceRowView {

    UUID getLessonId();

    UUID getStudentId();

    String getFullName();

    String getStatus();

    String getComment();

    java.time.LocalDate getLessonDate();
}
