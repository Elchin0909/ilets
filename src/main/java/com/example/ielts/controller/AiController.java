package com.example.ielts.controller;

import com.example.ielts.dto.AiChatRequest;
import com.example.ielts.dto.AiChatResponse;
import com.example.ielts.dto.BandPredictionResponse;
import com.example.ielts.dto.DictionaryRequest;
import com.example.ielts.dto.DictionaryResponse;
import com.example.ielts.dto.WritingAssessRequest;
import com.example.ielts.dto.WritingAssessResponse;
import com.example.ielts.service.AiService;
import com.example.ielts.service.DictionaryService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final DictionaryService dictionaryService;

    public AiController(AiService aiService, DictionaryService dictionaryService) {
        this.aiService = aiService;
        this.dictionaryService = dictionaryService;
    }

    @PostMapping("/predict-band/{studentId}")
    @PreAuthorize("isAuthenticated()")
    public BandPredictionResponse predictBand(@PathVariable UUID studentId) {
        return aiService.predictBand(studentId);
    }

    @PostMapping("/assess-writing")
    @PreAuthorize("isAuthenticated()")
    public WritingAssessResponse assessWriting(@RequestBody WritingAssessRequest req) {
        return aiService.assessWriting(req.text, req.taskType, req.studentId);
    }

    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public AiChatResponse chat(@RequestBody AiChatRequest req) {
        AiChatResponse response = new AiChatResponse();
        response.reply = aiService.chat(req.message);
        return response;
    }

    @PostMapping("/dictionary")
    @PreAuthorize("isAuthenticated()")
    public DictionaryResponse dictionary(@RequestBody DictionaryRequest req) {
        return dictionaryService.lookup(req.word, req.langPair);
    }
}
