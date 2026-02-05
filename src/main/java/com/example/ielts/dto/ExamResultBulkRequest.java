package com.example.ielts.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class ExamResultBulkRequest {
@NotEmpty
@Valid
    @NotNull
    public List<ExamResultUpsertRequest> items;
}
