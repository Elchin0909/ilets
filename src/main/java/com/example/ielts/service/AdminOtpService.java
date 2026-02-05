package com.example.ielts.service;

import com.example.ielts.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AdminOtpService {

    private final OtpService otpService;
    private final SendGridEmailService mail;

    @Value("${ADMIN_OTP_EMAIL:}")
    private String adminEmail;

    @Value("${ADMIN_OTP_ENABLED:false}")
    private boolean enabled;

    public AdminOtpService(OtpService otpService, SendGridEmailService mail) {
        this.otpService = otpService;
        this.mail = mail;
    }

    public void sendLoginOtp(User admin) {
        if (!enabled) return;
        String to = adminEmail;
        if (to == null || to.isBlank()) {
            throw new IllegalStateException("Admin OTP email is missing");
        }
        String key = loginKey(admin.getUsername());
        String code = otpService.generateOtp(key, Duration.ofMinutes(5));
        mail.sendEmail(to, "IELTS Admin Login Code", "Your login code: " + code + " (5 minutes)");
    }

    public void sendResetOtp(User admin) {
        if (!enabled) return;
        String to = adminEmail;
        if (to == null || to.isBlank()) {
            throw new IllegalStateException("Admin OTP email is missing");
        }
        String key = resetKey(admin.getUsername());
        String code = otpService.generateOtp(key, Duration.ofMinutes(10));
        mail.sendEmail(to, "IELTS Admin Reset Code", "Your reset code: " + code + " (10 minutes)");
    }

    public boolean verifyLoginOtp(String username, String code) {
        if (!enabled) return true;
        return otpService.verifyOtp(loginKey(username), code);
    }

    public boolean verifyResetOtp(String username, String code) {
        if (!enabled) return true;
        return otpService.verifyOtp(resetKey(username), code);
    }

    public boolean isEnabled() {
        return enabled;
    }

    private String loginKey(String username) {
        return "otp:admin:login:" + username;
    }

    private String resetKey(String username) {
        return "otp:admin:reset:" + username;
    }
}
