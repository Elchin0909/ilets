package com.example.ielts.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
public class OtpService {

    private final StringRedisTemplate redis;
    private final SecureRandom random = new SecureRandom();

    public OtpService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public String generateOtp(String key, Duration ttl) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        redis.opsForValue().set(key, code, ttl);
        return code;
    }

    public boolean verifyOtp(String key, String code) {
        String saved = redis.opsForValue().get(key);
        if (saved == null) return false;
        boolean ok = saved.equals(code);
        if (ok) {
            redis.delete(key);
        }
        return ok;
    }
}
