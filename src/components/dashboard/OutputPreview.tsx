import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Download, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OutputPreview = () => {
  const [playing, setPlaying] = useState(false);
  const [language, setLanguage] = useState("es");

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Output Preview</h3>

      {/* Player area */}
      <div className="relative aspect-video bg-muted/30 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setPlaying(!playing)}
          className="relative z-10 w-16 h-16 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center"
        >
          {playing ? (
            <Pause className="h-6 w-6 text-primary" />
          ) : (
            <Play className="h-6 w-6 text-primary ml-1" />
          )}
        </motion.button>

        {/* Playback indicator */}
        {playing && (
          <motion.div
            className="absolute bottom-3 left-3 flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Volume2 className="h-3 w-3 text-primary" />
            <div className="flex items-end gap-[2px]">
              {[0, 1, 2, 3].map((d) => (
                <motion.div
                  key={d}
                  className="w-1 bg-primary rounded-full"
                  animate={{ height: [4, 12, 4] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.1 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-44 bg-muted/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="es">🇪🇸 Spanish</SelectItem>
            <SelectItem value="fr">🇫🇷 French</SelectItem>
            <SelectItem value="de">🇩🇪 German</SelectItem>
            <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
            <SelectItem value="ko">🇰🇷 Korean</SelectItem>
            <SelectItem value="pt">🇧🇷 Portuguese</SelectItem>
          </SelectContent>
        </Select>

        <motion.div whileTap={{ scale: 0.95 }} className="ml-auto">
          <Button variant="outline" className="border-border hover:border-primary/40">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default OutputPreview;
