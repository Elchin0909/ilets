package com.example.ielts.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.SimpleCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_ATTENDANCE_TREND = "teacher:attendanceTrend";
    public static final String CACHE_AVG_EXAM_SCORE = "teacher:avgExamScore";
    public static final String CACHE_GROUP_ATTENDANCE_PCT = "teacher:groupAttendancePct";

    private ObjectMapper buildRedisObjectMapper() {
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Redis uchun type info (klassni saqlab qolish uchun)
        om.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );

        return om;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {

        var keySerializer = RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer());

        var redisMapper = buildRedisObjectMapper();
        var valueSerializer = RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer(redisMapper));

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(keySerializer)
                .serializeValuesWith(valueSerializer)
                .disableCachingNullValues()
                .entryTtl(Duration.ofMinutes(5))
                .prefixCacheNameWith("v1::");

        Map<String, RedisCacheConfiguration> perCache = new HashMap<>();
        perCache.put(CACHE_ATTENDANCE_TREND, defaultConfig.entryTtl(Duration.ofSeconds(30)));
        perCache.put(CACHE_GROUP_ATTENDANCE_PCT, defaultConfig.entryTtl(Duration.ofMinutes(1)));
        perCache.put(CACHE_AVG_EXAM_SCORE, defaultConfig.entryTtl(Duration.ofMinutes(2)));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(perCache)
                .build();
    }

    @Bean
    public CacheErrorHandler cacheErrorHandler() {
        return new SimpleCacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException ex, org.springframework.cache.Cache cache, Object key) {
                System.err.println("Redis cache read error, ignoring. cache="
                        + cache.getName() + ", key=" + key + ", msg=" + ex.getMessage());
            }
        };
    }
}
