package com.example.ielts.dto;

public class LoginResponse {
    public String token;
    public String role;

    public LoginResponse() {}

    public LoginResponse(String token, String role) {
        this.token = token;
        this.role = role;
    }
}

