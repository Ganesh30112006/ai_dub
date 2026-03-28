import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clapperboard, Podcast, RadioTower, GraduationCap } from "lucide-react";

const templates = [
  {
    title: "YouTube Shorts Dub",
    desc: "Auto-trim to vertical formats with fast language switching.",
    icon: Clapperboard,
    tag: "Creator",
  },
  {
    title: "Podcast Localization",
    desc: "Long-form timeline-safe dubbing with chapter markers.",
    icon: Podcast,
    tag: "Studio",
  },
  {
    title: "Ad Campaign Voice Pack",
    desc: "Batch-generate localized ad voiceovers with tone presets.",
    icon: RadioTower,
    tag: "Marketing",
  },
  {
    title: "Lecture Translation",
    desc: "Preserve speaker pacing and technical terminology.",
    icon: GraduationCap,
    tag: "Education",
  },
];

const ProjectTemplates = () => (
  <div className="grid md:grid-cols-2 gap-4">
    {templates.map((template, i) => (
      <motion.div
        key={template.title}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06 }}
      >
        <Card className="glass-card-hover border-glass-border h-full">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <template.icon className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline">{template.tag}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <CardTitle className="text-lg">{template.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{template.desc}</p>
            <Button variant="secondary" className="w-full">Use Template</Button>
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </div>
);

export default ProjectTemplates;
