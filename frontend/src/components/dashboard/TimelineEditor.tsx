import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useDubbing } from "@/context/DubbingContext";

interface Segment {
  id: number | string;
  speaker: string;
  start: number;
  end: number;
  color: string;
  text: string;
}

const TimelineEditor = () => {
  const { timeline, job } = useDubbing();
  const [selected, setSelected] = useState<number | string | null>(null);

  const segments: Segment[] = useMemo(
    () =>
      timeline.map((segment) => ({
        id: segment.id,
        speaker: segment.speaker,
        start: segment.startSeconds,
        end: segment.endSeconds,
        color: segment.color,
        text: segment.translatedText,
      })),
    [timeline],
  );

  const totalDuration = Math.max(100, ...segments.map((segment) => segment.end));

  if (!job) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-2">Timeline Editor</h3>
        <p className="text-sm text-muted-foreground">Start a dubbing job to generate timeline segments.</p>
      </div>
    );
  }

  if (job.status !== "COMPLETED") {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-2">Timeline Editor</h3>
        <p className="text-sm text-muted-foreground">
          Timeline will appear once processing completes. Current step: {job.currentStep}
        </p>
      </div>
    );
  }

  if (!segments.length) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-2">Timeline Editor</h3>
        <p className="text-sm text-muted-foreground">No segments were generated for this job.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Timeline Editor</h3>

      {/* Waveform visualization */}
      <div className="flex items-end gap-[2px] h-16 mb-4 px-1">
        {Array.from({ length: 120 }).map((_, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              backgroundColor: `hsl(175, 80%, 50%, ${0.3 + Math.random() * 0.4})`,
              height: `${15 + Math.sin(i * 0.3) * 30 + Math.random() * 40}%`,
            }}
            initial={{ height: 0 }}
            animate={{ height: `${15 + Math.sin(i * 0.3) * 30 + Math.random() * 40}%` }}
            transition={{ duration: 0.5, delay: i * 0.008 }}
          />
        ))}
      </div>

      {/* Timeline track */}
      <div className="relative h-14 bg-muted/30 rounded-lg overflow-hidden mb-3">
        {segments.map((seg) => (
          <motion.div
            key={seg.id}
            className={`absolute top-1 bottom-1 rounded-md cursor-pointer flex items-center px-2 overflow-hidden transition-all ${
              selected === seg.id ? "ring-2 ring-foreground/50" : ""
            }`}
            style={{
              left: `${(seg.start / totalDuration) * 100}%`,
              width: `${((seg.end - seg.start) / totalDuration) * 100}%`,
              backgroundColor: seg.color,
              opacity: selected === seg.id ? 1 : 0.7,
            }}
            onClick={() => setSelected(seg.id === selected ? null : seg.id)}
            whileHover={{ opacity: 1 }}
            layoutId={`seg-${seg.id}`}
          >
            <span className="text-xs font-medium text-background truncate">
              {seg.speaker}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Time markers */}
      <div className="flex justify-between text-xs text-muted-foreground font-mono px-1 mb-4">
        <span>0:00</span>
        <span>0:25</span>
        <span>0:50</span>
        <span>1:15</span>
        <span>1:40</span>
      </div>

      {/* Segment detail */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border rounded-lg p-4 bg-muted/20"
        >
          {(() => {
            const seg = segments.find((s) => s.id === selected)!;
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="font-medium text-sm">{seg.speaker}</span>
                  <span className="text-xs text-muted-foreground font-mono ml-auto">
                    {seg.start}s – {seg.end}s
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">"{seg.text}"</p>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
};

export default TimelineEditor;
