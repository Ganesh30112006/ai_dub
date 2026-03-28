import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user, isSessionResolved } = useAuth();

  if (!isSessionResolved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card px-6 py-4 text-sm text-muted-foreground">Restoring session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return children;
  }

  return <Navigate to={user?.onboardingCompleted ? "/dashboard" : "/onboarding"} replace />;
};

export default PublicOnlyRoute;
