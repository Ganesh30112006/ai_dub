import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, normalizeAuthUser, type AuthProviderName, type AuthUser } from "@/lib/auth-api";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSessionResolved: boolean;
  login: (input: { email: string; password: string; remember: boolean }) => Promise<void>;
  register: (input: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  loginWithProvider: (provider: Exclude<AuthProviderName, "email">) => Promise<void>;
  handleSocialCallback: (input: {
    provider: Exclude<AuthProviderName, "email">;
    code: string;
    state?: string;
  }) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSessionResolved, setIsSessionResolved] = useState(false);

  const syncSession = async () => {
    try {
      const response = await authApi.getSession();
      if (!response.user) {
        setUser(null);
      } else {
        setUser(normalizeAuthUser(response.user));
      }
    } catch {
      setUser(null);
    } finally {
      setIsSessionResolved(true);
    }
  };

  useEffect(() => {
    void syncSession();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const interval = window.setInterval(() => {
      void authApi
        .refreshSession()
        .then((response) => {
          if (!response.user) {
            setUser(null);
            return;
          }
          setUser(normalizeAuthUser(response.user));
        })
        .catch(() => {
          setUser(null);
        });
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [user]);

  const login: AuthContextType["login"] = async (input) => {
    const response = await authApi.login(input);
    if (!response.user) {
      throw new Error("Login response is missing user data");
    }
    setUser(normalizeAuthUser(response.user));
  };

  const register: AuthContextType["register"] = async (input) => {
    const response = await authApi.register(input);
    if (!response.user) {
      throw new Error("Register response is missing user data");
    }
    setUser(normalizeAuthUser(response.user));
  };

  const loginWithProvider: AuthContextType["loginWithProvider"] = async (provider) => {
    const response = await authApi.startSocialLogin({
      provider,
      redirectUri: `${window.location.origin}/auth/callback?provider=${provider}`,
    });

    const authorizationUrl = response.authorizationUrl || response.url;
    if (!authorizationUrl) {
      throw new Error("Social login URL was not returned by backend");
    }

    window.location.assign(authorizationUrl);
  };

  const handleSocialCallback: AuthContextType["handleSocialCallback"] = async ({ provider, code, state }) => {
    const response = await authApi.exchangeSocialCallback({ provider, code, state });
    if (!response.user) {
      throw new Error("Social callback response is missing user data");
    }
    setUser(normalizeAuthUser(response.user));
  };

  const refreshSession: AuthContextType["refreshSession"] = async () => {
    const response = await authApi.refreshSession();
    if (!response.user) {
      setUser(null);
      return;
    }
    setUser(normalizeAuthUser(response.user));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const completeOnboarding = async () => {
    try {
      const response = await authApi.updateOnboardingStatus({ completed: true });
      if (response.user) {
        setUser(normalizeAuthUser(response.user));
        return;
      }
    } catch {
      // Fallback below keeps frontend usable if backend endpoint is not yet deployed.
    }

    setUser((prev) => {
      if (!prev) {
        return null;
      }
      return { ...prev, onboardingCompleted: true };
    });
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isSessionResolved,
      login,
      register,
      loginWithProvider,
      handleSocialCallback,
      refreshSession,
      logout,
      completeOnboarding,
    }),
    [user, isSessionResolved],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
