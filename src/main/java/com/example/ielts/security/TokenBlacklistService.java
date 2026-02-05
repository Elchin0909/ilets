package com.example.ielts.security;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class TokenBlacklistService {

    private final StringRedisTemplate redis;

    public TokenBlacklistService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void blacklist(String tokenHash, Duration ttl) {
        // key: bl:<hash>
        redis.opsForValue().set("bl:" + tokenHash, "1", ttl);
    }

    public boolean isBlacklisted(String tokenHash) {
        return Boolean.TRUE.equals(redis.hasKey("bl:" + tokenHash));
    }
}
