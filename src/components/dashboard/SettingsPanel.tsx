import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const SettingsPanel = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 space-y-6"
  >
    <h3 className="text-lg font-semibold">Settings</h3>

    <div className="space-y-4">
      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">Source Language</Label>
        <Select defaultValue="en">
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
        <Select defaultValue="es">
          <SelectTrigger className="bg-muted/50 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
        <Select defaultValue="natural">
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
  </motion.div>
);

export default SettingsPanel;
