import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { AudioLines, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { login, register, loginWithProvider } = useAuth();
  const { toast } = useToast();

  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState<"google" | "github" | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({ title: "Missing fields", description: "Enter email and password to continue." });
      return;
    }
    try {
      setIsSubmitting(true);
      await login({ email: loginForm.email, password: loginForm.password, remember });
      toast({ title: "Signed in", description: "Welcome back. Let's set up your workspace." });
      navigate("/onboarding");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      toast({ title: "Sign in failed", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.password) {
      toast({ title: "Missing fields", description: "Complete all registration fields." });
      return;
    }
    try {
      setIsSubmitting(true);
      await register(registerForm);
      toast({ title: "Account created", description: "Your workspace is ready to onboard." });
      navigate("/onboarding");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account.";
      toast({ title: "Registration failed", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    try {
      setIsSocialSubmitting(provider);
      await loginWithProvider(provider);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start social sign in.";
      toast({ title: "Social sign in failed", description: message });
      setIsSocialSubmitting(null);
    }
  };

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center px-4 py-12">
      <motion.div
        className="absolute -top-20 -left-16 w-64 h-64 rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-accent/15 blur-3xl"
        animate={{ x: [0, -18, 0], y: [0, -14, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 relative z-10"
      >
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <AudioLines className="h-5 w-5" />
              <span className="font-semibold">DubFlow</span>
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to manage projects, voice models, and multilingual outputs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="pt-4">
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@studio.com"
                      className="bg-muted/40"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      className="bg-muted/40"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-muted-foreground">
                      <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(Boolean(checked))} />
                      Keep me signed in
                    </label>
                    <button type="button" className="text-primary hover:underline">Forgot password?</button>
                  </div>
                  <Button type="submit" className="w-full glow-button text-primary-foreground" disabled={isSubmitting}>
                    Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <div className="relative py-2 text-center text-xs text-muted-foreground">
                    <span className="bg-card px-2 relative z-10">or continue with</span>
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-border -z-0" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" onClick={() => handleSocialLogin("google")} disabled={isSocialSubmitting !== null}>
                      {isSocialSubmitting === "google" ? "Connecting..." : "Google"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => handleSocialLogin("github")} disabled={isSocialSubmitting !== null}>
                      {isSocialSubmitting === "github" ? "Connecting..." : "GitHub"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="register" className="pt-4">
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input
                        id="first-name"
                        placeholder="Ava"
                        className="bg-muted/40"
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input
                        id="last-name"
                        placeholder="Stone"
                        className="bg-muted/40"
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Work email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="team@studio.com"
                      className="bg-muted/40"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      className="bg-muted/40"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full glow-button text-primary-foreground" disabled={isSubmitting}>
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="glass-card border-glass-border p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-bold leading-tight mb-3">
              Manage your dubbing stack from one place.
            </h2>
            <p className="text-muted-foreground">
              Launch multilingual dubbing workflows with project-level collaboration, quality controls,
              and timeline-safe exports.
            </p>
          </div>

          <div className="space-y-3 mt-8">
            {[
              "Project-ready voice presets",
              "Automated noise cleanup and alignment",
              "Fast export to studio and social formats",
            ].map((item, idx) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="rounded-lg border border-border/70 bg-background/30 px-3 py-2 text-sm"
              >
                {item}
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
            <Button variant="secondary" onClick={() => navigate("/")}>Explore Demo</Button>
          </div>

          <p className="text-xs text-muted-foreground mt-5">
            By continuing, you agree to our <Link to="/" className="text-primary hover:underline">Terms</Link> and <Link to="/" className="text-primary hover:underline">Privacy</Link>.
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
