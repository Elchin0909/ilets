package com.example.ielts.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final Map<String, Object> details;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.details = null;
    }

    public ApiException(HttpStatus status, String message, Map<String, Object> details) {
        super(message);
        this.status = status;
        this.details = details;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Map<String, Object> getDetails() {
        return details;
    }
}
