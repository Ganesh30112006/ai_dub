package com.dubflow.auth.model;

public record AuthUser(
        String id,
        String name,
        String email,
        String provider,
        boolean onboardingCompleted
) {
}
