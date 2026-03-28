import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AudioLines, Wind, Users, FileText, Languages, Mic2, AlignHorizontalDistributeCenter, Check, Loader2 } from "lucide-react";

const steps = [
  { icon: AudioLines, label: "Audio Extraction" },
  { icon: Wind, label: "Noise Reduction" },
  { icon: Users, label: "Diarization" },
  { icon: FileText, label: "ASR / Transcription" },
  { icon: Languages, label: "Translation" },
  { icon: Mic2, label: "TTS Synthesis" },
  { icon: AlignHorizontalDistributeCenter, label: "Alignment" },
];

type Status = "pending" | "running" | "completed";

const ProcessingPipeline = () => {
  const [statuses, setStatuses] = useState<Status[]>(steps.map(() => "pending"));

  useEffect(() => {
    // Simulate pipeline progression
    let current = 0;
    const advance = () => {
      if (current >= steps.length) return;
      setStatuses((prev) => {
        const next = [...prev];
        if (current > 0) next[current - 1] = "completed";
        next[current] = "running";
        return next;
      });
      current++;
      setTimeout(advance, 2000 + Math.random() * 1500);
    };
    const t = setTimeout(advance, 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-6">Processing Pipeline</h3>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const status = statuses[i];
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                status === "running"
                  ? "bg-primary/10 border border-primary/20 step-glow-active"
                  : status === "completed"
                  ? "bg-muted/50 border border-transparent"
                  : "border border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  status === "running"
                    ? "bg-primary/20 text-primary"
                    : status === "completed"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {status === "running" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === "completed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  status === "running"
                    ? "text-primary"
                    : status === "completed"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {status === "running" && (
                <motion.div
                  className="ml-auto flex gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2].map((d) => (
                    <motion.div
                      key={d}
                      className="w-1 h-1 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessingPipeline;
