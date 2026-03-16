package com.example.ielts.controller;

import com.example.ielts.entity.SupportMessage;
import com.example.ielts.entity.SupportTicket;
import com.example.ielts.repo.SupportMessageRepository;
import com.example.ielts.repo.SupportTicketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final SupportTicketRepository ticketRepo;
    private final SupportMessageRepository messageRepo;

    public SupportController(SupportTicketRepository ticketRepo, SupportMessageRepository messageRepo) {
        this.ticketRepo = ticketRepo;
        this.messageRepo = messageRepo;
    }

    // ── Talaba: o'z ticketlari ──────────────────────────────────────────────

    @GetMapping("/my/{studentId}")
    @PreAuthorize("isAuthenticated()")
    public List<SupportTicket> myTickets(@PathVariable UUID studentId) {
        return ticketRepo.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    @PostMapping("/tickets")
    @PreAuthorize("isAuthenticated()")
    public SupportTicket createTicket(@RequestBody CreateTicketRequest req) {
        SupportTicket ticket = new SupportTicket();
        ticket.setStudentId(req.studentId);
        ticket.setStudentName(req.studentName);
        ticket.setSubject(req.subject);
        ticket.setStatus("OPEN");
        ticket.setUpdatedAt(LocalDateTime.now());
        SupportTicket saved = ticketRepo.save(ticket);

        // Birinchi xabar
        SupportMessage msg = new SupportMessage();
        msg.setTicketId(saved.getTicketId());
        msg.setSenderRole("STUDENT");
        msg.setSenderName(req.studentName);
        msg.setContent(req.message);
        messageRepo.save(msg);

        return saved;
    }

    // ── Ticket xabarlari ────────────────────────────────────────────────────

    @GetMapping("/tickets/{ticketId}/messages")
    @PreAuthorize("isAuthenticated()")
    public List<SupportMessage> getMessages(@PathVariable UUID ticketId) {
        return messageRepo.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @PostMapping("/tickets/{ticketId}/messages")
    @PreAuthorize("isAuthenticated()")
    public SupportMessage sendMessage(@PathVariable UUID ticketId, @RequestBody SendMessageRequest req) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        SupportMessage msg = new SupportMessage();
        msg.setTicketId(ticketId);
        msg.setSenderRole(req.senderRole);
        msg.setSenderName(req.senderName);
        msg.setContent(req.content);
        SupportMessage saved = messageRepo.save(msg);

        // Status yangilash
        if ("STAFF".equals(req.senderRole)) {
            ticket.setStatus("ANSWERED");
        } else {
            ticket.setStatus("OPEN");
        }
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepo.save(ticket);

        return saved;
    }

    // ── Admin/Reception: barcha ticketlar ────────────────────────────────────

    @GetMapping("/tickets")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public List<SupportTicket> allTickets(@RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return ticketRepo.findByStatusOrderByCreatedAtDesc(status.toUpperCase());
        }
        return ticketRepo.findAllByOrderByCreatedAtDesc();
    }

    @PatchMapping("/tickets/{ticketId}/close")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void closeTicket(@PathVariable UUID ticketId) {
        SupportTicket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        ticket.setStatus("CLOSED");
        ticket.setUpdatedAt(LocalDateTime.now());
        ticketRepo.save(ticket);
    }

    // ── DTOs ────────────────────────────────────────────────────────────────

    public static class CreateTicketRequest {
        public UUID studentId;
        public String studentName;
        public String subject;
        public String message;
    }

    public static class SendMessageRequest {
        public String senderRole;
        public String senderName;
        public String content;
    }
}
