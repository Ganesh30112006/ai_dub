import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

const steps = ["Profile", "Language", "Voice", "Finish"];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  const next = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const previous = () => setStep((prev) => Math.max(prev - 1, 0));

  const finish = async () => {
    try {
      await completeOnboarding();
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete onboarding.";
      toast({ title: "Onboarding error", description: message });
    }
  };

  return (
    <div className="min-h-screen hero-gradient px-4 py-12 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="text-2xl">Set up your workspace, {user?.name || "Creator"}</CardTitle>
            <p className="text-sm text-muted-foreground">Complete onboarding to unlock your production dashboard.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Step {step + 1} of {steps.length}</span>
                <span>{steps[step]}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {step === 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input placeholder="DubFlow Studio" className="bg-muted/40" />
                </div>
                <div className="space-y-2">
                  <Label>Team Size</Label>
                  <Select defaultValue="small">
                    <SelectTrigger className="bg-muted/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo</SelectItem>
                      <SelectItem value="small">2-10</SelectItem>
                      <SelectItem value="large">10+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="bg-muted/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary Target</Label>
                  <Select defaultValue="es">
                    <SelectTrigger className="bg-muted/40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <Label>Default Voice Profile</Label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {["Natural", "Clone", "Studio HD"].map((voice) => (
                    <div key={voice} className="rounded-lg border border-border/80 bg-background/40 p-3 text-sm">{voice}</div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                <p className="font-medium">Your workspace is ready.</p>
                <p className="text-sm text-muted-foreground mt-1">Proceed to dashboard and start your first dub pipeline.</p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={previous} disabled={step === 0}>Back</Button>
              {step < steps.length - 1 ? (
                <Button className="glow-button text-primary-foreground" onClick={next}>Continue</Button>
              ) : (
                <Button className="glow-button text-primary-foreground" onClick={() => void finish()}>Go to Dashboard</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
