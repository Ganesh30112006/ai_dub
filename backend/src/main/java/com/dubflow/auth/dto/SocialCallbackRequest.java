package com.dubflow.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record SocialCallbackRequest(
        @NotBlank(message = "Provider is required") String provider,
        @NotBlank(message = "Code is required") String code,
        String state
) {
}
