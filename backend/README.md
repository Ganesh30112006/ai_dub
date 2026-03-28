# DubFlow Spring Boot Auth Backend

This module provides auth endpoints required by the DubFlow frontend.

## Stack

- Spring Boot 3
- Java 17
- MySQL + Spring Data JPA
- Session-cookie auth (JSESSIONID)

## MySQL Setup

Default datasource values are configured for local MySQL:

- `DB_URL=jdbc:mysql://localhost:3306/dubflow?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- `DB_USERNAME=root`
- `DB_PASSWORD=root`

You can override these with environment variables before starting the server.

## Run

```bash
mvn spring-boot:run
```

Server default: `http://localhost:8081`

## API Prefix

All routes are under `/api/auth`.

## Endpoints

- `POST /login`
- `POST /register`
- `GET /session`
- `POST /session/refresh`
- `POST /logout`
- `POST /social/start`
- `POST /social/callback`
- `PATCH /onboarding`

### Dubbing

- `POST /api/dubbing/upload` (multipart media upload)
- `POST /api/dubbing/jobs` (start job)
- `GET /api/dubbing/jobs/{id}` (status/progress)
- `GET /api/dubbing/jobs/{id}/timeline` (AI-derived timeline segments)
- `GET /api/dubbing/jobs/{id}/export` (download dubbed media: mp3/mp4)

## Real AI Dubbing Requirements

Set these environment variables before running the backend:

- `OPENAI_API_KEY` (required)
- `OPENAI_BASE_URL` (optional, defaults to `https://api.openai.com/v1`)
- `OPENAI_TRANSCRIPTION_MODEL` (optional, default `whisper-1`)
- `OPENAI_TRANSLATION_MODEL` (optional, default `gpt-4o-mini`)
- `OPENAI_TTS_MODEL` (optional, default `gpt-4o-mini-tts`)

Additionally, install `ffmpeg` and ensure it is available on your `PATH` for:

- extracting audio from video uploads
- muxing dubbed audio back into mp4 video output

## Notes

- No Docker files are used or required.
- This backend now persists users in MySQL.
- Default upload limit is configured to 200MB.
