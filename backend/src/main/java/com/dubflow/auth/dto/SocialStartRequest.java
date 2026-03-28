package com.dubflow.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record SocialStartRequest(
        @NotBlank(message = "Provider is required") String provider,
        @NotBlank(message = "redirectUri is required") String redirectUri
) {
}
