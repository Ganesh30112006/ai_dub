import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const qualityMetrics = [
  { label: "Pronunciation Confidence", value: 92, flag: "good" },
  { label: "Timing Alignment", value: 86, flag: "watch" },
  { label: "Noise Residual", value: 18, flag: "good", inverse: true },
  { label: "Tone Consistency", value: 89, flag: "good" },
];

const segments = [
  { id: "SEG-08", issue: "Minor robotic tone", severity: "Medium" },
  { id: "SEG-13", issue: "Breath noise detected", severity: "Low" },
];

const VoiceQualityAnalytics = () => (
  <div className="grid xl:grid-cols-2 gap-6">
    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle className="text-lg">Voice Quality Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {qualityMetrics.map((metric, i) => {
          const normalized = metric.inverse ? 100 - metric.value : metric.value;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <span className="text-sm font-medium">{normalized}%</span>
              </div>
              <Progress value={normalized} className="h-2" />
            </motion.div>
          );
        })}
      </CardContent>
    </Card>

    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle className="text-lg">Segment Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {segments.map((segment, i) => (
          <motion.div
            key={segment.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border border-border/80 bg-background/30 p-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-sm">{segment.id}</p>
              <p className="text-xs text-muted-foreground">{segment.issue}</p>
            </div>
            <Badge variant={segment.severity === "Medium" ? "secondary" : "outline"}>{segment.severity}</Badge>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default VoiceQualityAnalytics;
