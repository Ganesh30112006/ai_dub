import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import UploadZone from "@/components/dashboard/UploadZone";
import ProcessingPipeline from "@/components/dashboard/ProcessingPipeline";
import TimelineEditor from "@/components/dashboard/TimelineEditor";
import OutputPreview from "@/components/dashboard/OutputPreview";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import ProjectTemplates from "@/components/dashboard/sections/ProjectTemplates";
import CollaborationPanel from "@/components/dashboard/sections/CollaborationPanel";
import VoiceQualityAnalytics from "@/components/dashboard/sections/VoiceQualityAnalytics";
import UsageBillingPanel from "@/components/dashboard/sections/UsageBillingPanel";
import UserProfilePanel from "@/components/dashboard/sections/UserProfilePanel";
import { DubbingProvider } from "@/context/DubbingContext";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32 } },
};

const titleByRoute: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/upload": "Upload",
  "/dashboard/pipeline": "Processing Pipeline",
  "/dashboard/timeline": "Timeline Editor",
  "/dashboard/output": "Output Preview",
  "/dashboard/templates": "Project Templates",
  "/dashboard/team": "Collaboration",
  "/dashboard/insights": "Voice Quality Insights",
  "/dashboard/billing": "Usage & Billing",
  "/dashboard/profile": "User Profile",
  "/dashboard/settings": "Settings",
};

const RouteTransition = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

const DashboardOverview = () => (
  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto relative z-10">
    <div className="lg:col-span-2 space-y-6">
      <motion.div variants={itemVariants}><UploadZone /></motion.div>
      <motion.div variants={itemVariants}><TimelineEditor /></motion.div>
      <motion.div variants={itemVariants}><OutputPreview /></motion.div>
    </div>
    <div className="space-y-6">
      <motion.div variants={itemVariants}><ProcessingPipeline /></motion.div>
      <motion.div variants={itemVariants}><SettingsPanel /></motion.div>
    </div>
  </motion.div>
);

const SingleColumn = ({ children }: { children: ReactNode }) => (
  <div className="max-w-[1400px] mx-auto relative z-10">
    <RouteTransition>{children}</RouteTransition>
  </div>
);

const Dashboard = () => {
  const location = useLocation();
  const title = titleByRoute[location.pathname] || "Dashboard";

  return (
    <DubbingProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-14 flex items-center border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-sm font-semibold">{title}</h1>
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-auto relative">
              <motion.div
                className="pointer-events-none absolute -top-8 left-1/3 w-56 h-56 rounded-full bg-primary/10 blur-3xl"
                animate={{ x: [0, 14, 0], y: [0, 12, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="pointer-events-none absolute bottom-4 right-8 w-56 h-56 rounded-full bg-accent/10 blur-3xl"
                animate={{ x: [0, -14, 0], y: [0, -10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />

              <Routes>
                <Route index element={<DashboardOverview />} />
                <Route path="upload" element={<SingleColumn><UploadZone /></SingleColumn>} />
                <Route path="pipeline" element={<SingleColumn><ProcessingPipeline /></SingleColumn>} />
                <Route path="timeline" element={<SingleColumn><TimelineEditor /></SingleColumn>} />
                <Route path="output" element={<SingleColumn><OutputPreview /></SingleColumn>} />
                <Route path="settings" element={<SingleColumn><SettingsPanel /></SingleColumn>} />
                <Route path="templates" element={<SingleColumn><ProjectTemplates /></SingleColumn>} />
                <Route path="team" element={<SingleColumn><CollaborationPanel /></SingleColumn>} />
                <Route path="insights" element={<SingleColumn><VoiceQualityAnalytics /></SingleColumn>} />
                <Route path="billing" element={<SingleColumn><UsageBillingPanel /></SingleColumn>} />
                <Route path="profile" element={<SingleColumn><UserProfilePanel /></SingleColumn>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </DubbingProvider>
  );
};

export default Dashboard;
