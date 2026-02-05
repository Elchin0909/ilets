package com.example.ielts.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApi(ApiException e, HttpServletRequest req) {
        var status = e.getStatus();
        var body = (e.getDetails() == null)
                ? ApiError.of(status.value(), e.getMessage(), req.getRequestURI())
                : ApiError.of(status.value(), e.getMessage(), req.getRequestURI(), e.getDetails());
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e, HttpServletRequest req) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            fields.put(fe.getField(), fe.getDefaultMessage());
        }

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("fields", fields);

        var body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed",
                req.getRequestURI(),
                details
        );
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParam(MissingServletRequestParameterException e, HttpServletRequest req) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("missing", e.getParameterName());

        var body = ApiError.of(
                HttpStatus.BAD_REQUEST.value(),
                "Missing request parameter",
                req.getRequestURI(),
                details
        );
        return ResponseEntity.badRequest().body(body);
    }

    // MUHIM: 401/403/404 statuslarni 500 qilib yubormaslik uchun
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleRse(ResponseStatusException e, HttpServletRequest req) {
        HttpStatus status = HttpStatus.valueOf(e.getStatusCode().value());
        var body = ApiError.of(
                status.value(),
                e.getReason() != null ? e.getReason() : status.getReasonPhrase(),
                req.getRequestURI()
        );
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAny(Exception e, HttpServletRequest req) {
        log.error("Unhandled error on path={}", req.getRequestURI(), e);
        var body = ApiError.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal server error",
                req.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
