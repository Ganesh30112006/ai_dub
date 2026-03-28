import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const comments = [
  { user: "AS", time: "2m ago", note: "Segment 08 sounds robotic in German. Try Natural Voice preset." },
  { user: "MK", time: "18m ago", note: "Timeline marker at 01:14 has minor overlap with SFX track." },
  { user: "RP", time: "1h ago", note: "Approved Spanish render for social cut." },
];

const versions = [
  { label: "v1.4", status: "Current", time: "Today 11:42" },
  { label: "v1.3", status: "Approved", time: "Today 10:08" },
  { label: "v1.2", status: "Archived", time: "Yesterday 19:21" },
];

const CollaborationPanel = () => (
  <div className="grid xl:grid-cols-2 gap-6">
    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle className="text-lg">Team Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comments.map((item, idx) => (
          <motion.div
            key={`${item.user}-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="flex gap-3 rounded-lg border border-border/80 bg-background/30 p-3"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/15 text-primary">{item.user}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm text-foreground">{item.note}</p>
              <p className="text-xs text-muted-foreground">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>

    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle className="text-lg">Version History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {versions.map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            className="flex items-center justify-between rounded-lg border border-border/80 bg-background/30 p-3"
          >
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.time}</p>
            </div>
            <Badge variant={item.status === "Current" ? "default" : "secondary"}>{item.status}</Badge>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default CollaborationPanel;
