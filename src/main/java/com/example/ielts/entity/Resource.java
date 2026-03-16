package com.example.ielts.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "resources", schema = "app")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "resource_id", nullable = false)
    private UUID resourceId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(length = 1000)
    private String description;

    /** GRAMMAR, VOCABULARY, IELTS, LISTENING, READING, WRITING, SPEAKING, OTHER */
    @Column(nullable = false, length = 30)
    private String category;

    /** PDF, LINK, VIDEO */
    @Column(nullable = false, length = 10)
    private String type;

    /** Uploaded file URL (for PDF type) */
    @Column(name = "file_url", length = 500)
    private String fileUrl;

    /** External link (for LINK type) */
    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
