export interface UploadResponse {
  uploadId: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
}

export interface DubbingStepStatus {
  label: string;
  status: "pending" | "running" | "completed";
}

export interface DubbingJobResponse {
  id: string;
  fileName: string;
  sourceLanguage: string;
  targetLanguage: string;
  voiceModel: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  progress: number;
  currentStep: string;
  createdAt: string;
  updatedAt: string;
  exportReady: boolean;
  steps: DubbingStepStatus[];
}

export interface TimelineSegmentResponse {
  id: number;
  speaker: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  translatedText: string;
  color: string;
}

export interface TimelineResponse {
  jobId: string;
  ready: boolean;
  segments: TimelineSegmentResponse[];
}

interface ApiErrorBody {
  message?: string;
  error?: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const DUBBING_BASE_PATH = import.meta.env.VITE_DUBBING_API_PATH || "/api/dubbing";

function toDubbingUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${DUBBING_BASE_PATH}${normalizedPath}`;
}

function getExportUrl(jobId: string) {
  return toDubbingUrl(`/jobs/${jobId}/export`);
}

async function parseError(response: Response) {
  let reason = "Request failed";
  try {
    const data = (await response.json()) as ApiErrorBody;
    reason = data.message || data.error || reason;
  } catch {
    // Ignore parse failure and keep fallback reason.
  }
  return reason;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(toDubbingUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

export const dubbingApi = {
  getExportUrl,

  async upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(toDubbingUrl("/upload"), {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return (await response.json()) as UploadResponse;
  },

  async createJob(input: { uploadId: string; sourceLanguage: string; targetLanguage: string; voiceModel: string }) {
    return requestJson<DubbingJobResponse>("/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
  },

  async getJob(jobId: string) {
    return requestJson<DubbingJobResponse>(`/jobs/${jobId}`, {
      method: "GET",
    });
  },

  async getTimeline(jobId: string) {
    return requestJson<TimelineResponse>(`/jobs/${jobId}/timeline`, {
      method: "GET",
    });
  },

  async downloadExport(jobId: string) {
    const response = await fetch(toDubbingUrl(`/jobs/${jobId}/export`), {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition") || "";
    const fileNameMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
    const fileName = fileNameMatch?.[1] || `dubflow-export-${jobId}.txt`;

    return { blob, fileName };
  },
};
