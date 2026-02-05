package com.example.ielts.entity;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ExamResultId implements Serializable {

    private UUID examId;
    private UUID studentId;
}
