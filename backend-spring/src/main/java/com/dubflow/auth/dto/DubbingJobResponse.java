package com.dubflow.auth.dto;

import java.time.Instant;
import java.util.List;

public record DubbingJobResponse(
        String id,
        String fileName,
        String sourceLanguage,
        String targetLanguage,
        String voiceModel,
        String status,
        int progress,
        String currentStep,
        Instant createdAt,
        Instant updatedAt,
        boolean exportReady,
        List<DubbingStepStatus> steps
) {
}
