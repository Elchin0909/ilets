package com.example.ielts.service;

import com.example.ielts.dto.StudentCreateRequest;
import com.example.ielts.dto.StudentResponse;
import com.example.ielts.entity.Student;
import com.example.ielts.repo.StudentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class StudentService {

    private final StudentRepository repo;

    public StudentService(StudentRepository repo) {
        this.repo = repo;
    }

    public StudentResponse create(StudentCreateRequest req) {
        Student s = new Student();

        s.setFullName(req.fullName);
        s.setEmail(req.email);
        s.setPhone(req.phone);
        s.setBirthDate(req.birthDate);


        Student saved = repo.save(s);
        return toResponse(saved);
    }

    public List<StudentResponse> list() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public StudentResponse get(UUID id) {
        Student s = repo.findById(id).orElseThrow();
        return toResponse(s);
    }

    public StudentResponse update(UUID id, StudentCreateRequest req) {
        Student s = repo.findById(id).orElseThrow();
        s.setFullName(req.fullName);
        s.setEmail(req.email);
        s.setPhone(req.phone);
        s.setBirthDate(req.birthDate);
        Student saved = repo.save(s);
        return toResponse(saved);
    }

    public void delete(UUID id) {
        repo.deleteById(id);
    }

    private StudentResponse toResponse(Student s) {
        StudentResponse r = new StudentResponse();
        r.studentId = s.getStudentId();
        r.fullName = s.getFullName();
        r.email = s.getEmail();
        r.phone = s.getPhone();
        r.birthDate = s.getBirthDate();
        r.createdAt = s.getCreatedAt();
        return r;
    }
}
