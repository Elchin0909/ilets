package com.example.ielts.service;

import com.example.ielts.dto.EnrollmentCreateRequest;
import com.example.ielts.dto.EnrollmentResponse;
import com.example.ielts.entity.Enrollment;
import com.example.ielts.repo.EnrollmentRepository;
import com.example.ielts.repo.GroupRepository;
import com.example.ielts.repo.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollRepo;
    private final StudentRepository studentRepo;
    private final GroupRepository groupRepo;

    public EnrollmentService(EnrollmentRepository enrollRepo,
                             StudentRepository studentRepo,
                             GroupRepository groupRepo) {
        this.enrollRepo = enrollRepo;
        this.studentRepo = studentRepo;
        this.groupRepo = groupRepo;
    }

    public EnrollmentResponse create(EnrollmentCreateRequest req) {

        if (!groupRepo.existsById(req.groupId))
            throw new RuntimeException("Group not found");

        if (!studentRepo.existsById(req.studentId))
            throw new RuntimeException("Student not found");

        if (enrollRepo.existsByGroupIdAndStudentId(req.groupId, req.studentId))
            throw new RuntimeException("Student already enrolled");

        Enrollment e = new Enrollment();
        e.setGroupId(req.groupId);
        e.setStudentId(req.studentId);
        e.setStatus("active");

        return toResponse(enrollRepo.save(e));
    }
    public List<EnrollmentResponse> listByGroup(UUID groupId) {
        return enrollRepo.findByGroupId(groupId).stream().map(this::toResponse).toList();
    }

    public List<EnrollmentResponse> listByStudent(UUID studentId) {
        return enrollRepo.findByStudentId(studentId).stream().map(this::toResponse).toList();
    }


    public List<EnrollmentResponse> list() {
        return enrollRepo.findAll().stream().map(this::toResponse).toList();
    }

    public EnrollmentResponse get(UUID id) {
        return toResponse(enrollRepo.findById(id).orElseThrow());
    }

    public void delete(UUID id) {
        enrollRepo.deleteById(id);
    }
    public EnrollmentResponse changeStatus(UUID id, String status) {
        Enrollment e = enrollRepo.findById(id).orElseThrow();
        e.setStatus(status);
        return toResponse(enrollRepo.save(e));
    }


    private EnrollmentResponse toResponse(Enrollment e) {
        EnrollmentResponse r = new EnrollmentResponse();
        r.enrollmentId = e.getEnrollmentId();
        r.groupId = e.getGroupId();
        r.studentId = e.getStudentId();
        r.enrolledAt = e.getEnrolledAt();
        r.status = e.getStatus();
        return r;
    }
}
