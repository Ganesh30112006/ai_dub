import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowIncompleteOnboarding?: boolean;
}

const ProtectedRoute = ({ children, allowIncompleteOnboarding = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isSessionResolved } = useAuth();
  const location = useLocation();

  if (!isSessionResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card px-6 py-4 text-sm text-muted-foreground">Restoring session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!allowIncompleteOnboarding && user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
