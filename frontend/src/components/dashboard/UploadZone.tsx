import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileAudio, FileVideo, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDubbing } from "@/context/DubbingContext";

const UploadZone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const { uploadedAsset, uploadFile, uploadInProgress, clearUpload, settings, updateSettings } = useDubbing();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      void performUpload(f);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      void performUpload(f);
    }
  };

  const performUpload = async (f: File) => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + Math.random() * 14;
      });
    }, 200);

    try {
      await uploadFile(f);
      setProgress(100);
    } finally {
      window.clearInterval(interval);
    }
  };

  const clearFile = () => {
    clearUpload();
    setProgress(0);
  };

  const uploadSampleAudio = async (assetPath: string, fileName: string) => {
    const response = await fetch(assetPath);
    if (!response.ok) {
      throw new Error("Unable to load sample audio");
    }
    const blob = await response.blob();
    const sampleFile = new File([blob], fileName, { type: "audio/wav" });
    await performUpload(sampleFile);
  };

  const applyLanguageForEnglishSample = () => {
    if (settings.targetLanguage === "en") {
      updateSettings({ sourceLanguage: "en", targetLanguage: "es" });
      return;
    }
    updateSettings({ sourceLanguage: "en" });
  };

  const applyLanguageForSpanishSample = () => {
    if (settings.targetLanguage === "es") {
      updateSettings({ sourceLanguage: "es", targetLanguage: "en" });
      return;
    }
    updateSettings({ sourceLanguage: "es" });
  };

  const file = uploadedAsset
    ? { name: uploadedAsset.fileName, type: uploadedAsset.contentType, size: uploadedAsset.sizeBytes }
    : null;

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Media</h3>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <input
              type="file"
              accept=".mp4,.mp3,.wav"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Upload className={`h-10 w-10 mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-sm text-muted-foreground">
              Drag & drop or <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">MP4, MP3, WAV</p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploadInProgress}
                onClick={(e) => {
                  e.preventDefault();
                  applyLanguageForEnglishSample();
                  void uploadSampleAudio("/demo-audio/english-sample.wav", "english-sample.wav");
                }}
              >
                Use English Sample
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={uploadInProgress}
                onClick={(e) => {
                  e.preventDefault();
                  applyLanguageForSpanishSample();
                  void uploadSampleAudio("/demo-audio/spanish-sample.wav", "spanish-sample.wav");
                }}
              >
                Use Spanish Sample
              </Button>
            </div>
          </motion.label>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-border rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              {file.type.includes("video") ? (
                <FileVideo className="h-8 w-8 text-primary" />
              ) : (
                <FileAudio className="h-8 w-8 text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-2">
              {uploadInProgress
                ? `Uploading... ${Math.min(Math.round(progress), 95)}%`
                : progress >= 100
                ? "Upload complete ✓"
                : "Ready"}
            </p>
            {uploadedAsset && (
              <p className="text-xs text-muted-foreground/70 mt-1">Upload ID: {uploadedAsset.uploadId.slice(0, 8)}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadZone;
