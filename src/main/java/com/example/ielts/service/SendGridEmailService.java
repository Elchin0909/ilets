package com.example.ielts.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class SendGridEmailService {

    @Value("${SENDGRID_API_KEY:}")
    private String apiKey;

    @Value("${SENDGRID_FROM_EMAIL:}")
    private String fromEmail;

    private final HttpClient client = HttpClient.newHttpClient();

    public void sendEmail(String to, String subject, String text) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("SendGrid API key is missing");
        }
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new IllegalStateException("SendGrid from email is missing");
        }

        String payload = "{\n" +
                "  \"personalizations\": [{\"to\": [{\"email\": \"" + escape(to) + "\"}]}],\n" +
                "  \"from\": {\"email\": \"" + escape(fromEmail) + "\"},\n" +
                "  \"subject\": \"" + escape(subject) + "\",\n" +
                "  \"content\": [{\"type\": \"text/plain\", \"value\": \"" + escape(text) + "\"}]\n" +
                "}";

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        try {
            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 300) {
                throw new IllegalStateException("SendGrid error: " + res.statusCode() + " - " + res.body());
            }
        } catch (Exception e) {
            throw new IllegalStateException("SendGrid send failed: " + e.getMessage(), e);
        }
    }

    private String escape(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }
}
