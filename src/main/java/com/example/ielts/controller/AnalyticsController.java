package com.example.ielts.controller;

import com.example.ielts.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final PaymentRepository paymentRepo;
    private final StudentRepository studentRepo;
    private final EnrollmentRepository enrollmentRepo;

    /**
     * Monthly revenue for last N months.
     * Returns: [{ month: "2026-01", amount: 5000000 }, ...]
     */
    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public List<Map<String, Object>> monthlyRevenue(
            @RequestParam(defaultValue = "6") int months
    ) {
        List<Map<String, Object>> result = new ArrayList<>();
        YearMonth now = YearMonth.now();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            String monthStr = ym.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            BigDecimal sum = paymentRepo.sumAmountByMonth(monthStr);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", monthStr);
            entry.put("label", ym.getMonth().getValue() + "-oy");
            entry.put("amount", sum);
            result.add(entry);
        }
        return result;
    }

    /**
     * Monthly new student count for last N months.
     * Returns: [{ month: "2026-01", count: 5 }, ...]
     */
    @GetMapping("/students-trend")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public List<Map<String, Object>> studentsTrend(
            @RequestParam(defaultValue = "6") int months
    ) {
        var allStudents = studentRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        YearMonth now = YearMonth.now();
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            long count = allStudents.stream()
                    .filter(s -> s.getCreatedAt() != null)
                    .filter(s -> {
                        YearMonth created = YearMonth.from(s.getCreatedAt());
                        return created.equals(ym);
                    })
                    .count();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", ym.format(DateTimeFormatter.ofPattern("yyyy-MM")));
            entry.put("label", ym.getMonth().getValue() + "-oy");
            entry.put("count", count);
            result.add(entry);
        }
        return result;
    }

    /**
     * Enrollment status breakdown.
     */
    @GetMapping("/enrollment-stats")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPTION')")
    public Map<String, Long> enrollmentStats() {
        var all = enrollmentRepo.findAll();
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("ACTIVE", all.stream().filter(e -> "ACTIVE".equalsIgnoreCase(e.getStatus())).count());
        result.put("COMPLETED", all.stream().filter(e -> "COMPLETED".equalsIgnoreCase(e.getStatus())).count());
        result.put("DROPPED", all.stream().filter(e -> "DROPPED".equalsIgnoreCase(e.getStatus())).count());
        result.put("total", (long) all.size());
        return result;
    }
}
