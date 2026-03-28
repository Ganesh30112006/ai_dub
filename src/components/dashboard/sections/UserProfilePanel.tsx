import { useState } from "react";
import { motion } from "framer-motion";
import { UserCircle2, Mail, ShieldCheck, Bell, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const UserProfilePanel = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [title, setTitle] = useState("Creative Producer");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [securityAlertsEnabled, setSecurityAlertsEnabled] = useState(true);

  const handleSave = () => {
    toast({
      title: "Profile updated",
      description: "Your profile preferences were saved locally.",
    });
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been signed out of your account.",
    });
  };

  return (
    <div className="grid xl:grid-cols-3 gap-6 max-w-[1400px] mx-auto">
      <motion.div
        className="xl:col-span-1"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="text-lg">Profile Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
              <UserCircle2 className="h-9 w-9 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.name || "Creator"}</p>
              <p className="text-sm text-muted-foreground">{user?.email || "No email set"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{user?.provider?.toUpperCase() || "EMAIL"}</Badge>
              <Badge variant="outline">{user?.onboardingCompleted ? "Onboarded" : "Onboarding Pending"}</Badge>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/30 p-3 text-sm text-muted-foreground">
              Keep your profile updated so team members can identify owners for dubbing jobs and approvals.
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="xl:col-span-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.06 }}
      >
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="text-lg">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full Name</Label>
                <div className="relative">
                  <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="profile-name" className="pl-9 bg-muted/40" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="profile-email" className="pl-9 bg-muted/40" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-title">Role / Title</Label>
              <Input id="profile-title" className="bg-muted/40" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-4 rounded-lg border border-border/70 bg-background/30 p-4">
              <p className="font-medium text-sm">Preferences</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4 text-primary" />
                  <span>Email notifications</span>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Security alerts</span>
                </div>
                <Switch checked={securityAlertsEnabled} onCheckedChange={setSecurityAlertsEnabled} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <Button className="glow-button text-primary-foreground" onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => void handleLogout()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserProfilePanel;
