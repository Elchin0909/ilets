package com.example.ielts.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String message,
        String path,
        OffsetDateTime timestamp,
        Map<String, Object> details
) {
    public static ApiError of(int status, String message, String path) {
        return new ApiError(status, message, path, OffsetDateTime.now(), null);
    }

    public static ApiError of(int status, String message, String path, Map<String, Object> details) {
        return new ApiError(status, message, path, OffsetDateTime.now(), details);
    }
}
