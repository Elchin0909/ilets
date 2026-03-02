package com.example.ielts.dto;

public class BandPredictionResponse {
    public String predictedBand;    // "6.5"
    public String confidence;       // "yuqori" | "o'rta" | "past"
    public String weakestSkill;     // "Writing"
    public String analysis;         // O'zbekcha tahlil
    public String recommendations;  // O'zbekcha maslahatlar
}
