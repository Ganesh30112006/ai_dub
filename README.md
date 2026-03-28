# DubFlow Frontend

TODO: Document your project here

## Spring Boot Backend (No Docker)

A Spring Boot auth backend is available in `backend-spring` and matches the frontend auth contract.

### Run Backend

1. Open a terminal in `backend-spring`
2. Start the server:

```bash
mvn spring-boot:run
```

Backend runs on `http://localhost:8081` by default.

MySQL is required for backend runtime. Default local values are:

- `DB_URL=jdbc:mysql://localhost:3306/dubflow?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- `DB_USERNAME=root`
- `DB_PASSWORD=root`

Override these environment variables if your local MySQL setup differs.

### Run Frontend Against Spring Boot

1. Keep `VITE_ENABLE_AUTH_MOCK=false`
2. Set `VITE_API_BASE_URL=http://localhost:8081`
3. Keep `VITE_AUTH_API_PATH=/api/auth`

Then run the frontend normally.

### Implemented Backend Endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/session`
- `POST /api/auth/session/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/social/start`
- `POST /api/auth/social/callback`
- `PATCH /api/auth/onboarding`

### Implemented Dubbing Endpoints

- `POST /api/dubbing/upload` (multipart form-data, `file`)
- `POST /api/dubbing/jobs`
- `GET /api/dubbing/jobs/{jobId}`
- `GET /api/dubbing/jobs/{jobId}/timeline`
- `GET /api/dubbing/jobs/{jobId}/export`

### Real AI Dubbing Setup

Backend dubbing now runs real AI stages (ASR -> translation -> TTS) and produces dubbed media output.

Required on backend runtime:

- `OPENAI_API_KEY`
- `ffmpeg` installed and available on `PATH`

## Auth API Wiring

Frontend auth is now connected to real HTTP endpoints via `src/lib/auth-api.ts`.

### Environment Variables

Copy `.env.example` to `.env` and configure:

- `VITE_API_BASE_URL` (optional): API origin, e.g. `https://api.yourdomain.com`
- `VITE_AUTH_API_PATH`: auth prefix, defaults to `/api/auth`
- `VITE_ENABLE_AUTH_MOCK`: set `true` to force frontend-only mock auth

If `VITE_API_BASE_URL` is empty during local development, mock auth is enabled automatically so login/register works without a backend.

### Expected Endpoints

All endpoints are prefixed by `VITE_API_BASE_URL + VITE_AUTH_API_PATH` and use JSON with cookies (`credentials: include`).

- `POST /login`
- `POST /register`
- `GET /session`
- `POST /session/refresh`
- `POST /logout`
- `POST /social/start`
- `POST /social/callback`
- `PATCH /onboarding`

### Expected User Payload

Responses should include:

```json
{
	"user": {
		"id": "string",
		"name": "string",
		"email": "string",
		"provider": "email|google|github",
		"onboardingCompleted": true
	}
}
```

The frontend is tolerant of `userId` and `fullName` as aliases.
