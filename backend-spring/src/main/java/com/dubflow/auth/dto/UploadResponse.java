package com.dubflow.auth.dto;

public record UploadResponse(
        String uploadId,
        String fileName,
        long sizeBytes,
        String contentType
) {
}
