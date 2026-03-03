package com.example.ielts.service;

import com.example.ielts.dto.TeacherCreateRequest;
import com.example.ielts.dto.TeacherResponse;
import com.example.ielts.entity.Teacher;
import com.example.ielts.entity.User;
import com.example.ielts.repo.TeacherRepository;
import com.example.ielts.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

@Service
public class TeacherService {

    private final TeacherRepository repo;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    public TeacherService(TeacherRepository repo, UserRepository userRepo, PasswordEncoder encoder) {
        this.repo = repo;
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    public TeacherResponse create(TeacherCreateRequest req) {
        // password is required on create
        if (req.password == null || req.password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parol majburiy");
        }
        if (req.username != null && !req.username.isBlank() && userRepo.existsByUsername(req.username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        Teacher t = new Teacher();
        t.setFullName(req.fullName);
        t.setPhone(req.phone);
        t.setEmail(req.email);
        t.setBirthDate(req.birthDate);
        t.setLoginUsername(req.username);

        Teacher saved = repo.save(t);

        // only create user account if username is provided
        if (req.username != null && !req.username.isBlank()) {
            User u = new User();
            u.setUsername(req.username);
            u.setPasswordHash(encoder.encode(req.password));
            u.setRole("TEACHER");
            u.setEnabled(true);
            u.setActive(true);
            u.setTeacherId(saved.getTeacherId());
            userRepo.save(u);
        }

        return toResponse(saved);
    }

    public List<TeacherResponse> list() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public TeacherResponse get(UUID id) {
        Teacher t = repo.findById(id).orElseThrow();
        return toResponse(t);
    }

    public TeacherResponse update(UUID id, TeacherCreateRequest req) {
        Teacher t = repo.findById(id).orElseThrow();
        t.setFullName(req.fullName);
        t.setPhone(req.phone);
        t.setEmail(req.email);
        t.setBirthDate(req.birthDate);
        t.setLoginUsername(req.username);

        Teacher saved = repo.save(t);

        User u = userRepo.findByTeacherId(id).orElseGet(User::new);
        if (u.getUserId() == null) {
            u.setRole("TEACHER");
            u.setEnabled(true);
            u.setActive(true);
            u.setTeacherId(id);
        }
        String existingUsername = u.getUsername();
        if (existingUsername != null && !existingUsername.equals(req.username) && userRepo.existsByUsername(req.username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        if (existingUsername == null && userRepo.existsByUsername(req.username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }
        u.setUsername(req.username);
        // only update password if a new one is provided
        if (req.password != null && !req.password.isBlank()) {
            u.setPasswordHash(encoder.encode(req.password));
        }
        userRepo.save(u);

        return toResponse(saved);
    }

    public void delete(UUID id) {
        repo.deleteById(id);
        userRepo.findByTeacherId(id).ifPresent(userRepo::delete);
    }

    private TeacherResponse toResponse(Teacher t) {
        TeacherResponse r = new TeacherResponse();
        r.teacherId = t.getTeacherId();
        r.fullName = t.getFullName();
        r.phone = t.getPhone();
        r.email = t.getEmail();
        r.birthDate = t.getBirthDate();
        r.createdAt = t.getCreatedAt();
        r.username = t.getLoginUsername();
        return r;
    }
}
