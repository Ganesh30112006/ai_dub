# DubFlow Frontend

TODO: Document your project here

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
