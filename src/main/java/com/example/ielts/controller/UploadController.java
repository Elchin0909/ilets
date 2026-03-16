package com.example.ielts.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Value("${app.upload.dir:/app/uploads}")
    private String uploadDir;

    private static final long MAX_SIZE = 5 * 1024 * 1024L;
    private static final long MAX_PDF_SIZE = 50 * 1024 * 1024L;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/avatar")
    public Map<String, String> uploadAvatar(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fayl bo'sh");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Faqat rasm fayllari qabul qilinadi (jpeg, png, gif, webp)");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fayl hajmi 5 MB dan oshmasligi kerak");
        }

        String ext = switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png"  -> "png";
            case "image/gif"  -> "gif";
            case "image/webp" -> "webp";
            default -> "jpg";
        };

        String filename = UUID.randomUUID() + "." + ext;
        Path dir    = Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();
        Path target = dir.resolve(filename);

        try {
            Files.createDirectories(dir);
            try (java.io.InputStream in = file.getInputStream()) {
                Files.copy(in, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fayl saqlashda xatolik: " + e.getMessage());
        }

        return Map.of("url", "/uploads/avatars/" + filename);
    }

    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    @PostMapping("/resource")
    public Map<String, String> uploadResource(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fayl bo'sh");
        }
        if (file.getSize() > MAX_PDF_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Fayl hajmi 50 MB dan oshmasligi kerak");
        }

        String original = file.getOriginalFilename();
        String ext = "pdf";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
        }

        String filename = UUID.randomUUID() + "." + ext;
        Path dir    = Paths.get(uploadDir, "resources").toAbsolutePath().normalize();
        Path target = dir.resolve(filename);

        try {
            Files.createDirectories(dir);
            try (java.io.InputStream in = file.getInputStream()) {
                Files.copy(in, target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fayl saqlashda xatolik: " + e.getMessage());
        }

        return Map.of("url", "/uploads/resources/" + filename);
    }
}
