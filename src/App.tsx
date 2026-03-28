import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
const Index = lazy(() => import("./pages/Index.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const AuthCallback = lazy(() => import("./pages/AuthCallback.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="glass-card px-6 py-4 text-sm text-muted-foreground">Loading DubFlow...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route
                path="/auth"
                element={
                  <PublicOnlyRoute>
                    <Auth />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute allowIncompleteOnboarding>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
