import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Download, Volume2, Sparkles, Captions, Languages, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDubbing } from "@/context/DubbingContext";
import { dubbingApi } from "@/lib/dubbing-api";

const OutputPreview = () => {
  const [playing, setPlaying] = useState(false);
  const { job, timeline, uploadedAsset, downloadExport } = useDubbing();
  const [language, setLanguage] = useState(job?.targetLanguage || "es");
  const [position, setPosition] = useState([32]);
  const [voiceMix, setVoiceMix] = useState([76]);
  const [ducking, setDucking] = useState([48]);
  const [exportFormat, setExportFormat] = useState("mp4");
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  const exportUrl = useMemo(() => {
    if (!job?.id || !job.exportReady) {
      return null;
    }
    return `${dubbingApi.getExportUrl(job.id)}?t=${encodeURIComponent(job.updatedAt || "")}`;
  }, [job?.id, job?.exportReady, job?.updatedAt]);

  const isVideoUpload = !!uploadedAsset?.contentType?.startsWith("video");

  useEffect(() => {
    setPlaying(false);
    if (mediaRef.current) {
      mediaRef.current.pause();
      mediaRef.current.currentTime = 0;
    }
  }, [exportUrl]);

  const togglePlayback = async () => {
    if (!mediaRef.current || !exportUrl) {
      return;
    }

    if (playing) {
      mediaRef.current.pause();
      setPlaying(false);
      return;
    }

    try {
      await mediaRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">Output Preview</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Quality {job?.status === "COMPLETED" ? "89" : "--"}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Languages className="h-3 w-3" />
            {timeline.length || 0} tracks
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="mix">Mix</TabsTrigger>
          <TabsTrigger value="captions">Captions</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4 pt-2">
          <div className="relative aspect-video bg-muted/30 rounded-xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10" />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge variant="outline" className="bg-background/50">Dub v1.4</Badge>
              <Badge variant="outline" className="bg-background/50">{(job?.targetLanguage || language).toUpperCase()}</Badge>
            </div>

            {exportUrl && isVideoUpload && exportFormat !== "wav" ? (
              <video
                ref={(el) => {
                  mediaRef.current = el;
                }}
                src={exportUrl}
                controls
                className="absolute inset-0 h-full w-full object-contain"
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                onEnded={() => setPlaying(false)}
              />
            ) : exportUrl ? (
              <div className="w-full px-6 relative z-10">
                <audio
                  ref={(el) => {
                    mediaRef.current = el;
                  }}
                  src={exportUrl}
                  controls
                  className="w-full"
                  onPause={() => setPlaying(false)}
                  onPlay={() => setPlaying(true)}
                  onEnded={() => setPlaying(false)}
                />
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Dubbed audio preview loaded from generated export.
                </p>
              </div>
            ) : (
              <p className="relative z-10 text-sm text-muted-foreground">No export yet. Complete dubbing to preview audio.</p>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              onClick={() => void togglePlayback()}
              disabled={!exportUrl}
              className="relative z-10 w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center"
            >
              {playing ? (
                <Pause className="h-6 w-6 text-primary" />
              ) : (
                <Play className="h-6 w-6 text-primary ml-1" />
              )}
            </motion.button>

            {playing && (
              <motion.div
                className="absolute bottom-3 left-3 flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Volume2 className="h-3 w-3 text-primary" />
                <div className="flex items-end gap-[2px]">
                  {[0, 1, 2, 3, 4].map((d) => (
                    <motion.div
                      key={d}
                      className="w-1 bg-primary rounded-full"
                      animate={{ height: [4, 13, 4] }}
                      transition={{ duration: 0.65, repeat: Infinity, delay: d * 0.08 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div className="absolute right-3 bottom-3 rounded-md bg-background/60 px-2 py-1 text-xs text-muted-foreground">
              01:{String(position[0]).padStart(2, "0")} / 03:40
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Seek</span>
              <span>{position[0]}%</span>
            </div>
            <Slider value={position} onValueChange={setPosition} max={100} step={1} />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/80 bg-background/30 p-3">
              <p className="text-xs text-muted-foreground">Pronunciation</p>
              <Progress value={job?.status === "COMPLETED" ? 92 : 0} className="h-2 mt-2" />
            </div>
            <div className="rounded-lg border border-border/80 bg-background/30 p-3">
              <p className="text-xs text-muted-foreground">Lip-sync</p>
              <Progress value={job?.status === "COMPLETED" ? 84 : 0} className="h-2 mt-2" />
            </div>
            <div className="rounded-lg border border-border/80 bg-background/30 p-3">
              <p className="text-xs text-muted-foreground">Background blend</p>
              <Progress value={job?.status === "COMPLETED" ? 88 : 0} className="h-2 mt-2" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mix" className="space-y-4 pt-2">
          <div className="rounded-xl border border-border/80 bg-background/30 p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Voice Track Level</span>
                <span>{voiceMix[0]}%</span>
              </div>
              <Slider value={voiceMix} onValueChange={setVoiceMix} max={100} step={1} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Music Ducking</span>
                <span>{ducking[0]}%</span>
              </div>
              <Slider value={ducking} onValueChange={setDucking} max={100} step={1} />
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              Auto balancing suggests keeping voice between 72%-82% for this clip.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="captions" className="space-y-3 pt-2">
          <div className="rounded-xl border border-border/80 bg-background/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Captions className="h-4 w-4 text-primary" />
              Subtitle Preview
            </div>
            {[
              ...(timeline.length
                ? timeline.map(
                    (segment) =>
                      `[${String(Math.floor(segment.startSeconds / 60)).padStart(2, "0")}:${String(segment.startSeconds % 60).padStart(2, "0")}] ${segment.translatedText}`,
                  )
                : ["Processing not complete yet. Captions will appear after alignment."]),
            ].map((line) => (
              <p key={line} className="text-sm text-muted-foreground leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <Select value={job?.targetLanguage || language} onValueChange={setLanguage}>
          <SelectTrigger className="w-44 bg-muted/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">🇺🇸 English</SelectItem>
            <SelectItem value="es">🇪🇸 Spanish</SelectItem>
            <SelectItem value="fr">🇫🇷 French</SelectItem>
            <SelectItem value="de">🇩🇪 German</SelectItem>
            <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
            <SelectItem value="ko">🇰🇷 Korean</SelectItem>
            <SelectItem value="pt">🇧🇷 Portuguese</SelectItem>
          </SelectContent>
        </Select>

        <Select value={exportFormat} onValueChange={setExportFormat}>
          <SelectTrigger className="w-40 bg-muted/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp4">MP4 Video</SelectItem>
            <SelectItem value="wav">WAV Audio</SelectItem>
            <SelectItem value="srt">SRT Captions</SelectItem>
            <SelectItem value="bundle">All Assets ZIP</SelectItem>
          </SelectContent>
        </Select>

        <motion.div whileTap={{ scale: 0.95 }} className="ml-auto flex gap-2">
          <Button variant="secondary" className="border-border hover:border-primary/40">
            Save Version
          </Button>
          <Button
            variant="outline"
            className="border-border hover:border-primary/40"
            disabled={!job?.exportReady}
            onClick={() => void downloadExport()}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default OutputPreview;
