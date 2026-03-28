import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDubbing } from "@/context/DubbingContext";

const SettingsPanel = () => {
  const { settings, updateSettings, startJob, uploadedAsset, job, jobStarting } = useDubbing();

  const handleSourceLanguageChange = (value: string) => {
    if (value === settings.targetLanguage) {
      const fallbackTarget = value === "es" ? "en" : "es";
      updateSettings({ sourceLanguage: value, targetLanguage: fallbackTarget });
      return;
    }
    updateSettings({ sourceLanguage: value });
  };

  const handleTargetLanguageChange = (value: string) => {
    if (value === settings.sourceLanguage) {
      const fallbackSource = value === "es" ? "en" : "es";
      updateSettings({ sourceLanguage: fallbackSource, targetLanguage: value });
      return;
    }
    updateSettings({ targetLanguage: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-6"
    >
      <h3 className="text-lg font-semibold">Settings</h3>

      <div className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Source Language</Label>
          <Select value={settings.sourceLanguage} onValueChange={handleSourceLanguageChange}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Target Language</Label>
          <Select value={settings.targetLanguage} onValueChange={handleTargetLanguageChange}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="ko">Korean</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Voice Model</Label>
          <Select value={settings.voiceModel} onValueChange={(value) => updateSettings({ voiceModel: value })}>
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="natural">Natural Voice</SelectItem>
              <SelectItem value="clone">Voice Clone</SelectItem>
              <SelectItem value="studio">Studio HD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <Label className="text-sm font-medium">High Quality Mode</Label>
            <p className="text-xs text-muted-foreground">Slower but higher fidelity</p>
          </div>
          <Switch />
        </div>
      </div>

      <Button onClick={() => void startJob()} disabled={!uploadedAsset || jobStarting} className="w-full">
        {jobStarting ? "Starting..." : "Start Dubbing"}
      </Button>

      {!uploadedAsset && (
        <p className="text-xs text-muted-foreground">Upload a media file first to enable processing.</p>
      )}

      {job && (
        <p className="text-xs text-muted-foreground">
          Active job: {job.id.slice(0, 8)} • {job.status} • {job.progress}%
        </p>
      )}
    </motion.div>
  );
};

export default SettingsPanel;
