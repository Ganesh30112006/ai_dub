import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileAudio, FileVideo, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const UploadZone = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<{ name: string; type: string; size: number } | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) simulateUpload(f);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) simulateUpload(f);
  };

  const simulateUpload = (f: File) => {
    setFile({ name: f.name, type: f.type, size: f.size });
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + Math.random() * 15;
      });
    }, 200);
  };

  const clearFile = () => { setFile(null); setProgress(0); };

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
              {progress >= 100 ? "Upload complete ✓" : `Uploading... ${Math.min(Math.round(progress), 99)}%`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadZone;
