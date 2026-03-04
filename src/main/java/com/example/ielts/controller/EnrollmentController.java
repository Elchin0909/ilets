package com.example.ielts.controller;

import com.example.ielts.dto.EnrollmentResponse;
import com.example.ielts.entity.Enrollment;
import com.example.ielts.entity.Student;
import com.example.ielts.repo.EnrollmentRepository;
import com.example.ielts.repo.StudentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups/{groupId}/enrollments")
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepo;
    private final StudentRepository studentRepo;

    public EnrollmentController(EnrollmentRepository enrollmentRepo,
                                StudentRepository studentRepo) {
        this.enrollmentRepo = enrollmentRepo;
        this.studentRepo = studentRepo;
    }

    @GetMapping
    public List<EnrollmentResponse> listByGroup(@PathVariable UUID groupId) {
        List<Enrollment> enrollments = enrollmentRepo.findByGroupId(groupId);

        // Bitta query bilan barcha studentlarni batch load qilish (N+1 muammosini yechish)
        List<UUID> studentIds = enrollments.stream()
                .map(Enrollment::getStudentId).distinct().toList();
        Map<UUID, String> nameMap = studentRepo.findAllById(studentIds).stream()
                .collect(Collectors.toMap(Student::getStudentId, Student::getFullName));

        return enrollments.stream()
                .sorted((a, b) -> {
                    String na = nameMap.getOrDefault(a.getStudentId(), "");
                    String nb = nameMap.getOrDefault(b.getStudentId(), "");
                    return na.compareToIgnoreCase(nb);
                })
                .map(e -> {
                    EnrollmentResponse r = new EnrollmentResponse();
                    r.enrollmentId = e.getEnrollmentId();
                    r.groupId = e.getGroupId();
                    r.studentId = e.getStudentId();
                    r.studentName = nameMap.get(e.getStudentId());
                    r.enrolledAt = e.getEnrolledAt();
                    r.status = e.getStatus();
                    return r;
                }).toList();
    }
}
