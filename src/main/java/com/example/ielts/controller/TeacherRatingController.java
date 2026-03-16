package com.example.ielts.controller;

import com.example.ielts.entity.TeacherRating;
import com.example.ielts.repo.TeacherRatingRepository;
import com.example.ielts.repo.StudentRepository;
import com.example.ielts.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/teacher-ratings")
@RequiredArgsConstructor
public class TeacherRatingController {

    private final TeacherRatingRepository ratingRepo;
    private final StudentRepository studentRepo;

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getTeacherRatings(@PathVariable UUID teacherId) {
        var ratings = ratingRepo.findByTeacherIdOrderByCreatedAtDesc(teacherId);
        Double avg = ratingRepo.avgRatingByTeacherId(teacherId);
        long count = ratingRepo.countByTeacherId(teacherId);

        List<Map<String, Object>> ratingList = ratings.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("ratingId", r.getRatingId());
            m.put("studentId", r.getStudentId());
            studentRepo.findById(r.getStudentId()).ifPresent(s -> m.put("studentName", s.getFullName()));
            m.put("rating", r.getRating());
            m.put("comment", r.getComment());
            m.put("createdAt", r.getCreatedAt());
            return m;
        }).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("teacherId", teacherId);
        result.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0);
        result.put("totalRatings", count);
        result.put("ratings", ratingList);
        return result;
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public TeacherRating rate(@RequestBody TeacherRating rating,
                              @AuthenticationPrincipal UserPrincipal principal) {
        UUID studentId = principal.getStudentId();
        if (studentId == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN);

        if (rating.getRating() < 1 || rating.getRating() > 5)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating 1-5 orasida bo'lishi kerak");

        var existing = ratingRepo.findByTeacherIdAndStudentId(rating.getTeacherId(), studentId);
        if (existing.isPresent()) {
            TeacherRating r = existing.get();
            r.setRating(rating.getRating());
            r.setComment(rating.getComment());
            return ratingRepo.save(r);
        }

        rating.setRatingId(null);
        rating.setStudentId(studentId);
        return ratingRepo.save(rating);
    }
}
