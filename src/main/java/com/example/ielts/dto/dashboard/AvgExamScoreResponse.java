package com.example.ielts.dto.dashboard;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

public class AvgExamScoreResponse implements Serializable {
    private UUID groupId;
    private LocalDate from;
    private LocalDate to;

    private Double avgScore;   // result yo‘q bo‘lsa null
    private long examCount;
    private long resultsCount;

    public AvgExamScoreResponse() {}

    public AvgExamScoreResponse(UUID groupId, LocalDate from, LocalDate to,
                                Double avgScore, long examCount, long resultsCount) {
        this.groupId = groupId;
        this.from = from;
        this.to = to;
        this.avgScore = avgScore;
        this.examCount = examCount;
        this.resultsCount = resultsCount;
    }

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }

    public LocalDate getFrom() { return from; }
    public void setFrom(LocalDate from) { this.from = from; }

    public LocalDate getTo() { return to; }
    public void setTo(LocalDate to) { this.to = to; }

    public Double getAvgScore() { return avgScore; }
    public void setAvgScore(Double avgScore) { this.avgScore = avgScore; }

    public long getExamCount() { return examCount; }
    public void setExamCount(long examCount) { this.examCount = examCount; }

    public long getResultsCount() { return resultsCount; }
    public void setResultsCount(long resultsCount) { this.resultsCount = resultsCount; }
}
