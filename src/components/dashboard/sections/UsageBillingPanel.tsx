import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const costs = [
  { label: "Dubbing Minutes", value: "$418.00", detail: "1,045 / 2,000 min used" },
  { label: "Voice Cloning", value: "$72.00", detail: "18 jobs this month" },
  { label: "Storage & Exports", value: "$46.00", detail: "113 GB active assets" },
];

const UsageBillingPanel = () => (
  <div className="grid xl:grid-cols-2 gap-6">
    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle className="text-lg">Current Plan Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/80 bg-background/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Professional Plan</span>
            <Badge>Active</Badge>
          </div>
          <Progress value={52} className="h-2" />
          <p className="text-xs text-muted-foreground">52% of included dubbing minutes consumed.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {costs.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-lg border border-border/80 bg-background/30 p-3"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-base font-semibold mt-1">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card className="glass-card border-glass-border">
      <CardHeader>
        <CardTitle className="text-lg">Forecast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-primary/30 bg-primary/8 p-4">
          <p className="text-sm">Projected monthly spend: <span className="font-semibold">$624.00</span></p>
          <p className="text-xs text-muted-foreground mt-1">Based on current run-rate and pending jobs.</p>
        </div>
        <div className="rounded-lg border border-border/80 bg-background/30 p-4">
          <p className="text-sm font-medium">Cost optimization suggestion</p>
          <p className="text-xs text-muted-foreground mt-1">Schedule low-priority renders during off-peak window to reduce compute cost by up to 14%.</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default UsageBillingPanel;
