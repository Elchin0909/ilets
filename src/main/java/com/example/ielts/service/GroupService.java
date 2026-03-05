package com.example.ielts.service;

import com.example.ielts.dto.GroupCreateRequest;
import com.example.ielts.dto.GroupResponse;
import com.example.ielts.entity.Group;
import com.example.ielts.repo.CourseRepository;
import com.example.ielts.repo.EnrollmentRepository;
import com.example.ielts.repo.GroupRepository;
import com.example.ielts.repo.TeacherRepository;
import com.example.ielts.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepo;
    private final TeacherRepository teacherRepo;
    private final CourseRepository courseRepo;
    private final EnrollmentRepository enrollmentRepo;

    public GroupResponse create(GroupCreateRequest req) {
        // faqat ADMIN/RECEPTION (double-check)
        UserPrincipal p = principal();
        if (!(p.isAdmin() || "RECEPTION".equals(p.getRole()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        validateRefs(req);
        validateDates(req);

        if (groupRepo.existsByGroupNameIgnoreCase(req.groupName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Group name already exists");
        }

        Group g = new Group();
        g.setCourseId(req.courseId);
        g.setTeacherId(req.teacherId);
        g.setGroupName(req.groupName);
        g.setStartDate(req.startDate);
        g.setEndDate(req.endDate);
        g.setSchedule(req.schedule);

        return toResponse(groupRepo.save(g));
    }

    public List<GroupResponse> list() {
        UserPrincipal p = principal();

        List<Group> groups;
        if (p.isAdmin() || "RECEPTION".equals(p.getRole())) {
            groups = groupRepo.findAll();
        } else if (p.isTeacher() && p.getTeacherId() != null) {
            groups = groupRepo.findAllByTeacherId(p.getTeacherId());
        } else if ("STUDENT".equals(p.getRole()) && p.getStudentId() != null) {
            groups = enrollmentRepo.findByStudentId(p.getStudentId()).stream()
                    .map(e -> groupRepo.findById(e.getGroupId()).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .toList();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        return groups.stream().map(this::toResponse).toList();
    }

    public GroupResponse get(UUID id) {
        UserPrincipal p = principal();

        Group g = groupRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));

        // ADMIN/RECEPTION -> ok
        if (p.isAdmin() || "RECEPTION".equals(p.getRole())) {
            return toResponse(g);
        }

        // TEACHER -> ownership shart
        if (p.isTeacher() && p.getTeacherId() != null) {
            boolean ok = groupRepo.existsByGroupIdAndTeacherId(id, p.getTeacherId());
            if (!ok) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
            }
            return toResponse(g);
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    public GroupResponse update(UUID id, GroupCreateRequest req) {
        UserPrincipal p = principal();

        // faqat ADMIN/RECEPTION (double-check)
        if (!(p.isAdmin() || "RECEPTION".equals(p.getRole()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        Group g = groupRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));

        validateRefs(req);
        validateDates(req);

        String newName = req.groupName;
        if (newName != null
                && !newName.equalsIgnoreCase(g.getGroupName())
                && groupRepo.existsByGroupNameIgnoreCase(newName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Group name already exists");
        }

        g.setCourseId(req.courseId);
        g.setTeacherId(req.teacherId);
        g.setGroupName(req.groupName);
        g.setStartDate(req.startDate);
        g.setEndDate(req.endDate);
        g.setSchedule(req.schedule);

        return toResponse(groupRepo.save(g));
    }

    public void delete(UUID id) {
        UserPrincipal p = principal();

        // faqat ADMIN/RECEPTION (double-check)
        if (!(p.isAdmin() || "RECEPTION".equals(p.getRole()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        if (!groupRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found");
        }

        groupRepo.deleteById(id);
    }

    private void validateRefs(GroupCreateRequest req) {
        if (req.teacherId == null || !teacherRepo.existsById(req.teacherId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher not found");
        }
        if (req.courseId == null || !courseRepo.existsById(req.courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
    }

    private void validateDates(GroupCreateRequest req) {
        if (req.startDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date is required");
        }
        if (req.endDate != null && req.endDate.isBefore(req.startDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
        }
    }

    private UserPrincipal principal() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || a.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (!(a.getPrincipal() instanceof UserPrincipal p)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return p;
    }

    private GroupResponse toResponse(Group g) {
        GroupResponse r = new GroupResponse();
        r.groupId  = g.getGroupId();
        r.courseId = g.getCourseId();
        r.teacherId = g.getTeacherId();
        r.groupName = g.getGroupName();
        r.startDate = g.getStartDate();
        r.endDate   = g.getEndDate();
        r.schedule  = g.getSchedule();
        r.createdAt = g.getCreatedAt();
        // enrich with names
        if (g.getTeacherId() != null) {
            teacherRepo.findById(g.getTeacherId())
                    .ifPresent(t -> r.teacherName = t.getFullName());
        }
        if (g.getCourseId() != null) {
            courseRepo.findById(g.getCourseId())
                    .ifPresent(c -> r.courseName = c.getTitle());
        }
        return r;
    }


}
