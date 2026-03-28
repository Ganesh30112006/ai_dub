package com.dubflow.auth.service;

import com.dubflow.auth.dto.LoginRequest;
import com.dubflow.auth.dto.RegisterRequest;
import com.dubflow.auth.exception.AuthException;
import com.dubflow.auth.model.AuthUser;
import com.dubflow.auth.model.UserRecord;
import com.dubflow.auth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    public static final String SESSION_USER_EMAIL_KEY = "DUBFLOW_USER_EMAIL";

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public AuthUser register(RegisterRequest input) {
        String normalizedEmail = normalizeEmail(input.email());
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AuthException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        UserRecord record = new UserRecord(
                UUID.randomUUID().toString(),
                input.firstName().trim(),
                input.lastName().trim(),
                normalizedEmail,
                passwordEncoder.encode(input.password()),
                "email"
        );

        userRepository.save(record);
        return toAuthUser(record);
    }

    @Transactional(readOnly = true)
    public AuthUser login(LoginRequest input) {
        String normalizedEmail = normalizeEmail(input.email());
        UserRecord record = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (record == null || !passwordEncoder.matches(input.password(), record.getPasswordHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return toAuthUser(record);
    }

    @Transactional(readOnly = true)
    public AuthUser getByEmail(String email) {
        UserRecord record = userRepository.findByEmail(normalizeEmail(email)).orElse(null);
        if (record == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Session expired");
        }
        return toAuthUser(record);
    }

    @Transactional
    public AuthUser markOnboarding(String email, boolean completed) {
        UserRecord record = userRepository.findByEmail(normalizeEmail(email)).orElse(null);
        if (record == null) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Session expired");
        }

        record.setOnboardingCompleted(completed);
        userRepository.save(record);
        return toAuthUser(record);
    }

    @Transactional
    public AuthUser loginOrCreateSocialUser(String provider, String code) {
        String normalizedProvider = provider.toLowerCase(Locale.ROOT);
        if (!normalizedProvider.equals("google") && !normalizedProvider.equals("github")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Unsupported provider");
        }

        String syntheticEmail = normalizedProvider + "." + code + "@example.com";
        String normalizedEmail = normalizeEmail(syntheticEmail);
        UserRecord existing = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (existing != null) {
            return toAuthUser(existing);
        }

        UserRecord created = new UserRecord(
                UUID.randomUUID().toString(),
                normalizedProvider.substring(0, 1).toUpperCase(Locale.ROOT) + normalizedProvider.substring(1),
                "User",
                normalizedEmail,
                passwordEncoder.encode(UUID.randomUUID().toString()),
                normalizedProvider
        );

            userRepository.save(created);
        return toAuthUser(created);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private AuthUser toAuthUser(UserRecord record) {
        return new AuthUser(
                record.getId(),
                record.fullName(),
                record.getEmail(),
                record.getProvider(),
                record.isOnboardingCompleted()
        );
    }
}
