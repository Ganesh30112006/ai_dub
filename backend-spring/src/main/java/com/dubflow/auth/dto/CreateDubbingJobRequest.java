package com.dubflow.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateDubbingJobRequest(
        @NotBlank(message = "uploadId is required") String uploadId,
        @NotBlank(message = "sourceLanguage is required") String sourceLanguage,
        @NotBlank(message = "targetLanguage is required") String targetLanguage,
        @NotBlank(message = "voiceModel is required") String voiceModel
) {
}
