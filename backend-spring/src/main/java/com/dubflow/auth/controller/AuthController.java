package com.dubflow.auth.controller;

import com.dubflow.auth.dto.AuthEnvelope;
import com.dubflow.auth.dto.LoginRequest;
import com.dubflow.auth.dto.OnboardingRequest;
import com.dubflow.auth.dto.RegisterRequest;
import com.dubflow.auth.dto.SocialCallbackRequest;
import com.dubflow.auth.dto.SocialStartRequest;
import com.dubflow.auth.dto.SocialStartResponse;
import com.dubflow.auth.exception.AuthException;
import com.dubflow.auth.model.AuthUser;
import com.dubflow.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthEnvelope register(@Valid @RequestBody RegisterRequest input, HttpServletRequest request) {
        AuthUser user = authService.register(input);
        request.getSession(true).setAttribute(AuthService.SESSION_USER_EMAIL_KEY, user.email());
        return new AuthEnvelope(user);
    }

    @PostMapping("/login")
    public AuthEnvelope login(@Valid @RequestBody LoginRequest input, HttpServletRequest request) {
        AuthUser user = authService.login(input);
        request.getSession(true).setAttribute(AuthService.SESSION_USER_EMAIL_KEY, user.email());
        return new AuthEnvelope(user);
    }

    @GetMapping("/session")
    public AuthEnvelope session(HttpSession session) {
        String email = sessionUserEmail(session);
        if (email == null) {
            return new AuthEnvelope(null);
        }
        return new AuthEnvelope(authService.getByEmail(email));
    }

    @PostMapping("/session/refresh")
    public AuthEnvelope refresh(HttpSession session) {
        String email = sessionUserEmail(session);
        if (email == null) {
            return new AuthEnvelope(null);
        }
        return new AuthEnvelope(authService.getByEmail(email));
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    @PatchMapping("/onboarding")
    public AuthEnvelope onboarding(@RequestBody OnboardingRequest input, HttpSession session) {
        String email = sessionUserEmail(session);
        if (email == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "You are not signed in");
        }
        return new AuthEnvelope(authService.markOnboarding(email, input.completed()));
    }

    @PostMapping("/social/start")
    public SocialStartResponse socialStart(@Valid @RequestBody SocialStartRequest input) {
        String provider = input.provider().toLowerCase();
        if (!provider.equals("google") && !provider.equals("github")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Unsupported provider");
        }

        String authorizationUrl = input.redirectUri() + "&code=mock-" + provider + "-code&state=mock-state";
        return new SocialStartResponse(authorizationUrl);
    }

    @PostMapping("/social/callback")
    public AuthEnvelope socialCallback(@Valid @RequestBody SocialCallbackRequest input, HttpServletRequest request) {
        AuthUser user = authService.loginOrCreateSocialUser(input.provider(), input.code());
        request.getSession(true).setAttribute(AuthService.SESSION_USER_EMAIL_KEY, user.email());
        return new AuthEnvelope(user);
    }

    private String sessionUserEmail(HttpSession session) {
        Object email = session.getAttribute(AuthService.SESSION_USER_EMAIL_KEY);
        return email instanceof String value ? value : null;
    }
}
