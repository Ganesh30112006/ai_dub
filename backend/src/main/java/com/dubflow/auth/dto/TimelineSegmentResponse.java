package com.dubflow.auth.dto;

public record TimelineSegmentResponse(
        long id,
        String speaker,
        int startSeconds,
        int endSeconds,
        String text,
        String translatedText,
        String color
) {
}
