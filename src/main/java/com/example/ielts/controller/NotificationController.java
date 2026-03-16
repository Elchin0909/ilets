package com.example.ielts.controller;

import com.example.ielts.entity.Notification;
import com.example.ielts.repo.NotificationRepository;
import com.example.ielts.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepo;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Notification> myNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(principal.getUserId());
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return Map.of("count", notificationRepo.countByUserIdAndReadFalse(principal.getUserId()));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public Notification markRead(@PathVariable UUID id) {
        Notification n = notificationRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        n.setRead(true);
        return notificationRepo.save(n);
    }

    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public void markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        var unread = notificationRepo.findByUserIdAndReadFalseOrderByCreatedAtDesc(principal.getUserId());
        unread.forEach(n -> n.setRead(true));
        notificationRepo.saveAll(unread);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Notification create(@RequestBody Notification notification) {
        notification.setNotificationId(null);
        notification.setRead(false);
        return notificationRepo.save(notification);
    }
}
