package com.example.ielts.service;

import com.example.ielts.dto.DictionaryResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class DictionaryService {

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Bepul API lar orqali so'z tarjimasi:
     * 1. MyMemory API — tarjima (en↔uz, en↔ru)
     * 2. Free Dictionary API — inglizcha so'z uchun pronunciation, examples, synonyms
     */
    public DictionaryResponse lookup(String word, String langPair) {
        if (word == null || word.isBlank()) {
            DictionaryResponse r = new DictionaryResponse();
            r.word = "";
            r.translation = "";
            return r;
        }

        String trimmed = word.trim();

        // langPair: "en-uz", "uz-en", "en-ru", "ru-en"
        String from, to;
        switch (langPair != null ? langPair : "en-uz") {
            case "uz-en" -> { from = "uz"; to = "en"; }
            case "ru-en" -> { from = "ru"; to = "en"; }
            case "en-ru" -> { from = "en"; to = "ru"; }
            default ->      { from = "en"; to = "uz"; }
        }

        DictionaryResponse result = new DictionaryResponse();
        result.word = trimmed;
        result.examples = new ArrayList<>();
        result.synonyms = new ArrayList<>();

        // 1) MyMemory — tarjima
        try {
            String encoded = URLEncoder.encode(trimmed, StandardCharsets.UTF_8);
            String url = "https://api.mymemory.translated.net/get?q=" + encoded
                    + "&langpair=" + from + "|" + to;

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "IELTS-Centre/1.0")
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode root = mapper.readTree(resp.body());
                JsonNode responseData = root.path("responseData");
                String translation = responseData.path("translatedText").asText("");
                if (!translation.isBlank() && !translation.equalsIgnoreCase(trimmed)) {
                    result.translation = translation;
                }

                // Qo'shimcha tarjimalar (matches) — sinonimlar sifatida
                JsonNode matches = root.path("matches");
                if (matches.isArray()) {
                    for (JsonNode match : matches) {
                        String seg = match.path("segment").asText("");
                        String trans = match.path("translation").asText("");
                        if (!trans.isBlank()
                                && !trans.equalsIgnoreCase(result.translation)
                                && !trans.equalsIgnoreCase(trimmed)
                                && result.synonyms.size() < 5) {
                            result.synonyms.add(trans);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // MyMemory ishlamasa, davom etamiz
        }

        // 2) Free Dictionary API — faqat inglizcha so'zlar uchun (pronunciation, examples, part of speech)
        String dictWord = "en".equals(from) ? trimmed : result.translation;
        if (dictWord != null && !dictWord.isBlank()) {
            try {
                String encoded = URLEncoder.encode(dictWord.split("[,;]")[0].trim(), StandardCharsets.UTF_8);
                String url = "https://api.dictionaryapi.dev/api/v2/entries/en/" + encoded;

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("User-Agent", "IELTS-Centre/1.0")
                        .GET()
                        .build();

                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() == 200) {
                    JsonNode entries = mapper.readTree(resp.body());
                    if (entries.isArray() && !entries.isEmpty()) {
                        JsonNode first = entries.get(0);

                        // Pronunciation
                        JsonNode phonetics = first.path("phonetics");
                        if (phonetics.isArray()) {
                            for (JsonNode p : phonetics) {
                                String text = p.path("text").asText("");
                                if (!text.isBlank()) {
                                    result.pronunciation = text;
                                    break;
                                }
                            }
                        }

                        // Meanings — part of speech, definitions, examples, synonyms
                        JsonNode meanings = first.path("meanings");
                        if (meanings.isArray() && !meanings.isEmpty()) {
                            JsonNode firstMeaning = meanings.get(0);
                            result.partOfSpeech = firstMeaning.path("partOfSpeech").asText("");

                            // Definitions + examples
                            JsonNode definitions = firstMeaning.path("definitions");
                            if (definitions.isArray()) {
                                for (int i = 0; i < Math.min(definitions.size(), 3); i++) {
                                    JsonNode def = definitions.get(i);
                                    String example = def.path("example").asText("");
                                    if (!example.isBlank() && result.examples.size() < 3) {
                                        result.examples.add(example);
                                    }
                                }
                            }

                            // Synonyms from dictionary
                            JsonNode syns = firstMeaning.path("synonyms");
                            if (syns.isArray()) {
                                for (int i = 0; i < Math.min(syns.size(), 5); i++) {
                                    String syn = syns.get(i).asText("");
                                    if (!syn.isBlank() && !result.synonyms.contains(syn)) {
                                        result.synonyms.add(syn);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception ignored) {
                // Dictionary API ishlamasa, davom etamiz
            }
        }

        // Fallback — tarjima topilmagan bo'lsa
        if (result.translation == null || result.translation.isBlank()) {
            result.translation = "Tarjima topilmadi";
        }

        return result;
    }
}
