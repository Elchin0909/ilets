package com.example.ielts.controller;

import com.example.ielts.dto.PaymentCreateRequest;
import com.example.ielts.dto.PaymentResponse;
import com.example.ielts.service.PaymentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    /** Yangi to'lov qo'shish — ADMIN yoki RECEPTION */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public PaymentResponse create(@RequestBody PaymentCreateRequest req) {
        return service.create(req);
    }

    /** Barcha to'lovlar ro'yxati — ADMIN yoki RECEPTION */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public List<PaymentResponse> listAll() {
        return service.listAll();
    }

    /** Bitta talabaning to'lovlari */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("isAuthenticated()")
    public List<PaymentResponse> listByStudent(@PathVariable UUID studentId) {
        return service.listByStudent(studentId);
    }

    /** Talabaning jami to'lagan summasi */
    @GetMapping("/student/{studentId}/total")
    @PreAuthorize("isAuthenticated()")
    public BigDecimal totalByStudent(@PathVariable UUID studentId) {
        return service.totalByStudent(studentId);
    }

    /** Oy bo'yicha jami tushum */
    @GetMapping("/month/{month}/total")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public BigDecimal totalByMonth(@PathVariable String month) {
        return service.totalByMonth(month);
    }

    /** Qarzdor talabalar (shu oy uchun to'lov qilmaganlar) */
    @GetMapping("/debtors")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public List<Map<String, Object>> getDebtors(@RequestParam(required = false) String month) {
        return service.getDebtors(month);
    }

    /** To'lovni o'chirish — faqat ADMIN */
    @DeleteMapping("/{paymentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable UUID paymentId) {
        service.delete(paymentId);
    }
}
