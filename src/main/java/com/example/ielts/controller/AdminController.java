package com.example.ielts.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/something")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> something() {
        return Map.of(
                "ok", true,
                "msg", "admin endpoint works"
        );
    }
}
