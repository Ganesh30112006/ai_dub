import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { handleSocialCallback } = useAuth();

  useEffect(() => {
    const run = async () => {
      const provider = searchParams.get("provider");
      const code = searchParams.get("code");
      const state = searchParams.get("state") || undefined;
      const authError = searchParams.get("error");

      if (authError) {
        toast({ title: "Social sign in failed", description: authError });
        navigate("/auth", { replace: true });
        return;
      }

      if (!provider || !code || (provider !== "google" && provider !== "github")) {
        toast({ title: "Invalid callback", description: "Missing provider or authorization code." });
        navigate("/auth", { replace: true });
        return;
      }

      try {
        await handleSocialCallback({ provider, code, state });
        toast({ title: "Sign in successful" });
        navigate("/dashboard", { replace: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to complete sign in.";
        toast({ title: "Social sign in failed", description: message });
        navigate("/auth", { replace: true });
      }
    };

    void run();
  }, [handleSocialCallback, navigate, searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background hero-gradient px-4">
      <div className="glass-card px-6 py-4 text-sm text-muted-foreground">
        Finalizing your sign in...
      </div>
    </div>
  );
};

export default AuthCallback;
