import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  dubbingApi,
  type DubbingJobResponse,
  type TimelineSegmentResponse,
  type UploadResponse,
} from "@/lib/dubbing-api";

interface DubbingSettings {
  sourceLanguage: string;
  targetLanguage: string;
  voiceModel: string;
}

interface DubbingContextType {
  uploadedAsset: UploadResponse | null;
  job: DubbingJobResponse | null;
  timeline: TimelineSegmentResponse[];
  settings: DubbingSettings;
  uploadInProgress: boolean;
  jobStarting: boolean;
  refreshInProgress: boolean;
  uploadFile: (file: File) => Promise<void>;
  clearUpload: () => void;
  updateSettings: (patch: Partial<DubbingSettings>) => void;
  startJob: () => Promise<void>;
  refreshJob: () => Promise<void>;
  fetchTimeline: () => Promise<void>;
  downloadExport: () => Promise<void>;
}

const DubbingContext = createContext<DubbingContextType | undefined>(undefined);

export const DubbingProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [uploadedAsset, setUploadedAsset] = useState<UploadResponse | null>(null);
  const [job, setJob] = useState<DubbingJobResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineSegmentResponse[]>([]);
  const [settings, setSettings] = useState<DubbingSettings>({
    sourceLanguage: "en",
    targetLanguage: "es",
    voiceModel: "natural",
  });

  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [jobStarting, setJobStarting] = useState(false);
  const [refreshInProgress, setRefreshInProgress] = useState(false);

  const updateSettings = (patch: Partial<DubbingSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const uploadFile = async (file: File) => {
    setUploadInProgress(true);
    try {
      const uploaded = await dubbingApi.upload(file);
      setUploadedAsset(uploaded);
      setJob(null);
      setTimeline([]);
      toast({ title: "Upload complete", description: `${uploaded.fileName} uploaded successfully.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload file";
      toast({ title: "Upload failed", description: message });
      throw error;
    } finally {
      setUploadInProgress(false);
    }
  };

  const clearUpload = () => {
    setUploadedAsset(null);
    setJob(null);
    setTimeline([]);
  };

  const startJob = async () => {
    if (!uploadedAsset) {
      toast({ title: "Upload required", description: "Upload media before starting dubbing." });
      return;
    }

    setJobStarting(true);
    try {
      const created = await dubbingApi.createJob({
        uploadId: uploadedAsset.uploadId,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
        voiceModel: settings.voiceModel,
      });
      setJob(created);
      setTimeline([]);
      toast({ title: "Dubbing started", description: `Job ${created.id.slice(0, 8)} is processing.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start dubbing job";
      toast({ title: "Job start failed", description: message });
      throw error;
    } finally {
      setJobStarting(false);
    }
  };

  const refreshJob = async () => {
    if (!job) {
      return;
    }

    setRefreshInProgress(true);
    try {
      const latest = await dubbingApi.getJob(job.id);
      setJob(latest);
      if (latest.status === "COMPLETED") {
        const timelineResponse = await dubbingApi.getTimeline(latest.id);
        setTimeline(timelineResponse.segments);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh job";
      toast({ title: "Refresh failed", description: message });
    } finally {
      setRefreshInProgress(false);
    }
  };

  const fetchTimeline = async () => {
    if (!job) {
      return;
    }

    try {
      const timelineResponse = await dubbingApi.getTimeline(job.id);
      setTimeline(timelineResponse.segments);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load timeline";
      toast({ title: "Timeline load failed", description: message });
    }
  };

  const downloadExport = async () => {
    if (!job) {
      toast({ title: "No job available", description: "Start dubbing to generate an export." });
      return;
    }

    try {
      const { blob, fileName } = await dubbingApi.downloadExport(job.id);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast({ title: "Export downloaded", description: fileName });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to download export";
      toast({ title: "Export failed", description: message });
    }
  };

  useEffect(() => {
    if (!job || job.status !== "RUNNING") {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshJob();
    }, 2500);

    return () => {
      window.clearInterval(interval);
    };
  }, [job]);

  const value = {
    uploadedAsset,
    job,
    timeline,
    settings,
    uploadInProgress,
    jobStarting,
    refreshInProgress,
    uploadFile,
    clearUpload,
    updateSettings,
    startJob,
    refreshJob,
    fetchTimeline,
    downloadExport,
  };

  return <DubbingContext.Provider value={value}>{children}</DubbingContext.Provider>;
};

export const useDubbing = () => {
  const context = useContext(DubbingContext);
  if (!context) {
    throw new Error("useDubbing must be used within DubbingProvider");
  }
  return context;
};
