export type AuthProviderName = "email" | "google" | "github";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  provider: AuthProviderName;
  onboardingCompleted: boolean;
}

interface ApiAuthUser {
  id?: string;
  userId?: string;
  name?: string;
  fullName?: string;
  email?: string;
  provider?: string;
  onboardingCompleted?: boolean;
}

interface AuthEnvelope {
  user?: ApiAuthUser;
}

interface StartSocialResponse {
  authorizationUrl?: string;
  url?: string;
}

interface ApiErrorBody {
  message?: string;
  error?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const AUTH_BASE_PATH = import.meta.env.VITE_AUTH_API_PATH || "/api/auth";
const MOCK_AUTH_STORAGE_KEY = "dubflow-mock-auth-session";
const SHOULD_USE_MOCK_AUTH =
  import.meta.env.VITE_ENABLE_AUTH_MOCK === "true" ||
  (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL);

function generateId() {
  const cryptoApi = globalThis.crypto;

  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }

  const fallback = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${fallback()}${fallback()}-${fallback()}-4${fallback().slice(1)}-${((8 + Math.random() * 4) | 0).toString(16)}${fallback().slice(1)}-${fallback()}${fallback()}${fallback()}`;
}

function toAuthUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${AUTH_BASE_PATH}${normalizedPath}`;
}

function readMockSession(): AuthUser | null {
  const raw = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    return null;
  }
}

function writeMockSession(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(user));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(toAuthUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let reason = "Request failed";
    try {
      const data = (await response.json()) as ApiErrorBody;
      reason = data.message || data.error || reason;
    } catch {
      // Ignore body parse failures and use default reason.
    }
    throw new Error(reason);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export function normalizeAuthUser(data: ApiAuthUser | undefined): AuthUser {
  if (!data?.email) {
    throw new Error("Invalid auth user payload from server");
  }

  const providerRaw = (data.provider || "email").toLowerCase();
  const provider: AuthProviderName =
    providerRaw === "google" || providerRaw === "github" ? providerRaw : "email";

  const displayName = data.name || data.fullName || data.email.split("@")[0] || "User";

  return {
    id: data.id || data.userId || generateId(),
    name: displayName,
    email: data.email,
    provider,
    onboardingCompleted: Boolean(data.onboardingCompleted),
  };
}

export const authApi = {
  async login(input: { email: string; password: string; remember: boolean }) {
    if (SHOULD_USE_MOCK_AUTH) {
      const namePart = input.email.split("@")[0] || "User";
      const mockUser: AuthUser = {
        id: generateId(),
        name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
        email: input.email,
        provider: "email",
        onboardingCompleted: false,
      };
      writeMockSession(mockUser);
      return { user: mockUser };
    }

    return request<AuthEnvelope>("/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async register(input: { firstName: string; lastName: string; email: string; password: string }) {
    if (SHOULD_USE_MOCK_AUTH) {
      const mockUser: AuthUser = {
        id: generateId(),
        name: `${input.firstName} ${input.lastName}`.trim(),
        email: input.email,
        provider: "email",
        onboardingCompleted: false,
      };
      writeMockSession(mockUser);
      return { user: mockUser };
    }

    return request<AuthEnvelope>("/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getSession() {
    if (SHOULD_USE_MOCK_AUTH) {
      return { user: readMockSession() || undefined };
    }

    return request<AuthEnvelope>("/session", {
      method: "GET",
    });
  },

  async refreshSession() {
    if (SHOULD_USE_MOCK_AUTH) {
      return { user: readMockSession() || undefined };
    }

    return request<AuthEnvelope>("/session/refresh", {
      method: "POST",
    });
  },

  async logout() {
    if (SHOULD_USE_MOCK_AUTH) {
      writeMockSession(null);
      return;
    }

    return request<void>("/logout", {
      method: "POST",
    });
  },

  async startSocialLogin(input: { provider: Exclude<AuthProviderName, "email">; redirectUri: string }) {
    if (SHOULD_USE_MOCK_AUTH) {
      const callbackUrl = new URL(input.redirectUri);
      callbackUrl.searchParams.set("code", "mock-code");
      callbackUrl.searchParams.set("state", "mock-state");
      return { authorizationUrl: callbackUrl.toString() };
    }

    return request<StartSocialResponse>("/social/start", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async exchangeSocialCallback(input: {
    provider: Exclude<AuthProviderName, "email">;
    code: string;
    state?: string;
  }) {
    if (SHOULD_USE_MOCK_AUTH) {
      const mockUser: AuthUser = {
        id: generateId(),
        name: input.provider === "google" ? "Google User" : "GitHub User",
        email: input.provider === "google" ? "google.user@example.com" : "github.user@example.com",
        provider: input.provider,
        onboardingCompleted: false,
      };
      writeMockSession(mockUser);
      return { user: mockUser };
    }

    return request<AuthEnvelope>("/social/callback", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateOnboardingStatus(input: { completed: boolean }) {
    if (SHOULD_USE_MOCK_AUTH) {
      const current = readMockSession();
      if (!current) {
        return { user: undefined };
      }
      const updated = { ...current, onboardingCompleted: input.completed };
      writeMockSession(updated);
      return { user: updated };
    }

    return request<AuthEnvelope>("/onboarding", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
};
