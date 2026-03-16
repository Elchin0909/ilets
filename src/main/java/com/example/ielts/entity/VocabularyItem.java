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
@Table(name = "vocabulary_items", schema = "app")
public class VocabularyItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(nullable = false, length = 200)
    private String word;

    @Column(nullable = false, length = 500)
    private String translation;

    /** "uz-en", "en-uz", "ru-en", "en-ru" */
    @Column(name = "lang_pair", length = 10)
    private String langPair;

    @Column(length = 100)
    private String pronunciation;

    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech;

    /** JSON array stored as text */
    @Column(columnDefinition = "TEXT")
    private String examples;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
