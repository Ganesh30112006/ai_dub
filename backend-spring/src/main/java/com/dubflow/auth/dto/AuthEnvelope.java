package com.dubflow.auth.dto;

import com.dubflow.auth.model.AuthUser;

public record AuthEnvelope(AuthUser user) {
}
