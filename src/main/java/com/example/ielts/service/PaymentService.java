package com.example.ielts.service;

import com.example.ielts.dto.PaymentCreateRequest;
import com.example.ielts.dto.PaymentResponse;
import com.example.ielts.entity.Payment;
import com.example.ielts.repo.PaymentRepository;
import com.example.ielts.repo.StudentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.ielts.repo.EnrollmentRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepo;
    private final StudentRepository studentRepo;
    private final EnrollmentRepository enrollmentRepo;

    public PaymentService(PaymentRepository paymentRepo, StudentRepository studentRepo, EnrollmentRepository enrollmentRepo) {
        this.paymentRepo = paymentRepo;
        this.studentRepo = studentRepo;
        this.enrollmentRepo = enrollmentRepo;
    }

    public PaymentResponse create(PaymentCreateRequest req) {
        // Validate student exists
        var student = studentRepo.findById(req.studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Talaba topilmadi"));

        Payment p = new Payment();
        p.setStudentId(req.studentId);
        p.setAmount(req.amount);
        p.setCurrency(req.currency != null ? req.currency : "UZS");
        p.setType(req.type != null ? req.type : "MONTHLY");
        p.setMonth(req.month);
        p.setNotes(req.notes);
        p.setPaidAt(req.paidAt != null ? req.paidAt : LocalDate.now());

        Payment saved = paymentRepo.save(p);
        return toResponse(saved, student.getFullName());
    }

    public List<PaymentResponse> listAll() {
        return paymentRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(p -> {
                    String name = studentRepo.findById(p.getStudentId())
                            .map(s -> s.getFullName()).orElse("—");
                    return toResponse(p, name);
                }).toList();
    }

    public List<PaymentResponse> listByStudent(UUID studentId) {
        var student = studentRepo.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Talaba topilmadi"));
        return paymentRepo.findByStudentIdOrderByCreatedAtDesc(studentId).stream()
                .map(p -> toResponse(p, student.getFullName())).toList();
    }

    public BigDecimal totalByStudent(UUID studentId) {
        return paymentRepo.sumAmountByStudentId(studentId);
    }

    public BigDecimal totalByMonth(String month) {
        return paymentRepo.sumAmountByMonth(month);
    }

    public void delete(UUID paymentId) {
        if (!paymentRepo.existsById(paymentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "To'lov topilmadi");
        }
        paymentRepo.deleteById(paymentId);
    }

    public List<Map<String, Object>> getDebtors(String month) {
        if (month == null || month.isBlank()) {
            month = YearMonth.now().toString(); // "2026-03"
        }
        // 1. All students with active enrollments
        var allEnrollments = enrollmentRepo.findAll();
        Set<UUID> activeStudentIds = allEnrollments.stream()
                .filter(e -> "ACTIVE".equalsIgnoreCase(e.getStatus()))
                .map(e -> e.getStudentId())
                .collect(Collectors.toSet());

        // 2. Students who paid this month
        Set<UUID> paidIds = new HashSet<>(paymentRepo.findPaidStudentIdsByMonth(month));

        // 3. Debtors = active - paid
        activeStudentIds.removeAll(paidIds);

        // 4. Build response
        List<Map<String, Object>> result = new ArrayList<>();
        for (UUID sid : activeStudentIds) {
            var student = studentRepo.findById(sid).orElse(null);
            if (student == null) continue;
            // Find student's groups
            var studentEnrollments = allEnrollments.stream()
                    .filter(e -> e.getStudentId().equals(sid) && "ACTIVE".equalsIgnoreCase(e.getStatus()))
                    .toList();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("studentId", sid);
            row.put("fullName", student.getFullName());
            row.put("phone", student.getPhone());
            row.put("groupCount", studentEnrollments.size());
            result.add(row);
        }
        result.sort(Comparator.comparing(m -> (String) m.get("fullName")));
        return result;
    }

    private PaymentResponse toResponse(Payment p, String studentName) {
        PaymentResponse r = new PaymentResponse();
        r.paymentId = p.getPaymentId();
        r.studentId = p.getStudentId();
        r.studentName = studentName;
        r.amount = p.getAmount();
        r.currency = p.getCurrency();
        r.type = p.getType();
        r.month = p.getMonth();
        r.notes = p.getNotes();
        r.paidAt = p.getPaidAt();
        r.createdAt = p.getCreatedAt();
        return r;
    }
}
