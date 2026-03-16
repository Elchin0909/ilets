package com.example.ielts.service;

import com.example.ielts.dto.StudentCreateRequest;
import com.example.ielts.dto.StudentResponse;
import com.example.ielts.entity.Student;
import com.example.ielts.repo.StudentRepository;
import com.example.ielts.repo.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class StudentService {

    private final StudentRepository repo;
    private final UserRepository userRepo;

    public StudentService(StudentRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
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

    public StudentResponse updateAvatar(UUID id, String avatarUrl) {
        Student s = repo.findById(id).orElseThrow();
        s.setAvatarUrl(avatarUrl);
        return toResponse(repo.save(s));
    }

    private StudentResponse toResponse(Student s) {
        StudentResponse r = new StudentResponse();
        r.studentId = s.getStudentId();
        r.fullName = s.getFullName();
        r.email = s.getEmail();
        r.phone = s.getPhone();
        r.birthDate = s.getBirthDate();
        r.createdAt = s.getCreatedAt();
        r.avatarUrl = s.getAvatarUrl();
        r.ieltsBandScore = s.getIeltsBandScore();
        r.targetBandScore = s.getTargetBandScore();
        userRepo.findByStudentId(s.getStudentId()).ifPresent(u -> {
            r.hasAccount = true;
            r.username = u.getUsername();
        });
        return r;
    }
}
