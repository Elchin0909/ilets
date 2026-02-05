package com.example.ielts.service;

import com.example.ielts.dto.CourseCreateRequest;
import com.example.ielts.dto.CourseResponse;
import com.example.ielts.entity.Course;
import com.example.ielts.repo.CourseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class CourseService {

    private final CourseRepository repo;

    public CourseService(CourseRepository repo) {
        this.repo = repo;
    }

    public CourseResponse create(CourseCreateRequest req) {
        Course c = new Course();
        c.setTitle(req.title);
        c.setLevel(req.level);
        c.setDurationWeeks(req.durationWeeks);

        return toResponse(repo.save(c));
    }

    public List<CourseResponse> list() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public CourseResponse get(UUID id) {
        return toResponse(repo.findById(id).orElseThrow());
    }

    public CourseResponse update(UUID id, CourseCreateRequest req) {
        Course c = repo.findById(id).orElseThrow();
        c.setTitle(req.title);
        c.setLevel(req.level);
        c.setDurationWeeks(req.durationWeeks);
        return toResponse(repo.save(c));
    }

    public void delete(UUID id) {
        repo.deleteById(id);
    }

    private CourseResponse toResponse(Course c) {
        CourseResponse r = new CourseResponse();
        r.courseId = c.getCourseId();
        r.title = c.getTitle();
        r.level = c.getLevel();
        r.durationWeeks = c.getDurationWeeks();
        r.createdAt = c.getCreatedAt();
        return r;
    }
}

