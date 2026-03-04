package com.example.ielts.service;

import com.example.ielts.dto.LessonCreateRequest;
import com.example.ielts.entity.Lesson;
import com.example.ielts.repo.AttendanceRepository;
import com.example.ielts.repo.GroupRepository;
import com.example.ielts.repo.LessonRepository;
import com.example.ielts.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LessonService {

    private final LessonRepository lessonRepo;
    private final GroupRepository groupRepo;
    private final AttendanceRepository attendanceRepo;

    public Lesson create(LessonCreateRequest req) {
        if (req == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is null");
        if (req.getGroupId() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "groupId is required");
        if (req.getLessonDate() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lessonDate is required");

        UserPrincipal me = me();
        if ("TEACHER".equals(me.getRole())) {
            if (me.getTeacherId() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TeacherId is missing");
            }
            boolean ok = groupRepo.existsByGroupIdAndTeacherId(req.getGroupId(), me.getTeacherId());
            if (!ok) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This group is not yours");
        }

        Lesson l = new Lesson();
        l.setLessonId(UUID.randomUUID());
        l.setGroupId(req.getGroupId());
        l.setLessonDate(req.getLessonDate());
        l.setTopic(req.getTopic());
        l.setHomework(req.getHomework());

        try {
            return lessonRepo.save(l);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bu guruhda " + req.getLessonDate() + " sanasida dars allaqachon mavjud.");
        }
    }

    public Lesson update(UUID id, LessonCreateRequest req) {
        Lesson l = lessonRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

        UserPrincipal me = me();
        if ("TEACHER".equals(me.getRole())) {
            if (me.getTeacherId() == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TeacherId is missing");
            boolean ok = groupRepo.existsByGroupIdAndTeacherId(l.getGroupId(), me.getTeacherId());
            if (!ok) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This group is not yours");
        }

        if (req.getLessonDate() != null) l.setLessonDate(req.getLessonDate());
        if (req.getTopic() != null) l.setTopic(req.getTopic());
        l.setHomework(req.getHomework()); // allow clearing homework (null ok)

        return lessonRepo.save(l);
    }

    @Transactional
    public void delete(UUID id) {
        Lesson l = lessonRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

        UserPrincipal me = me();
        if ("TEACHER".equals(me.getRole())) {
            if (me.getTeacherId() == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TeacherId is missing");
            boolean ok = groupRepo.existsByGroupIdAndTeacherId(l.getGroupId(), me.getTeacherId());
            if (!ok) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This group is not yours");
        }

        attendanceRepo.deleteAll(attendanceRepo.findByLessonId(id));
        lessonRepo.deleteById(id);
    }

    public List<Lesson> byGroup(UUID groupId) {
        if (groupId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "groupId is required");

        UserPrincipal me = me();
        if ("TEACHER".equals(me.getRole())) {
            if (me.getTeacherId() == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TeacherId is missing");
            boolean ok = groupRepo.existsByGroupIdAndTeacherId(groupId, me.getTeacherId());
            if (!ok) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This group is not yours");
        }

        return lessonRepo.findByGroupIdOrderByLessonDateAsc(groupId);
    }

    private UserPrincipal me() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal p)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return p;
    }
}
