package com.example.ielts.repo;

import com.example.ielts.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByStudentIdOrderByCreatedAtDesc(UUID studentId);

    List<Payment> findAllByOrderByCreatedAtDesc();

    List<Payment> findByMonth(String month);

    boolean existsByStudentIdAndMonth(UUID studentId, String month);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.studentId = :studentId")
    BigDecimal sumAmountByStudentId(@Param("studentId") UUID studentId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.month = :month")
    BigDecimal sumAmountByMonth(@Param("month") String month);
}
