import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import UploadZone from "@/components/dashboard/UploadZone";
import ProcessingPipeline from "@/components/dashboard/ProcessingPipeline";
import TimelineEditor from "@/components/dashboard/TimelineEditor";
import OutputPreview from "@/components/dashboard/OutputPreview";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import { motion } from "framer-motion";

const Dashboard = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <SidebarTrigger className="mr-4" />
          <h1 className="text-sm font-semibold">Dashboard</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto"
          >
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <UploadZone />
              <TimelineEditor />
              <OutputPreview />
            </div>
            {/* Right column */}
            <div className="space-y-6">
              <ProcessingPipeline />
              <SettingsPanel />
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  </SidebarProvider>
);

export default Dashboard;
