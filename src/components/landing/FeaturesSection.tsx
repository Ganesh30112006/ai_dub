import { motion } from "framer-motion";
import { Languages, Mic2, Wand2, Zap, Shield, Layers } from "lucide-react";

const features = [
  { icon: Mic2, title: "Audio Extraction", desc: "Isolate vocals from any media with advanced source separation." },
  { icon: Languages, title: "50+ Languages", desc: "Translate and dub into over 50 languages with natural intonation." },
  { icon: Wand2, title: "Voice Cloning", desc: "Preserve the original speaker's voice characteristics across languages." },
  { icon: Zap, title: "Real-time Processing", desc: "GPU-accelerated pipeline delivers results in minutes, not hours." },
  { icon: Shield, title: "Noise Reduction", desc: "AI-powered denoising ensures crystal-clear audio output." },
  { icon: Layers, title: "Timeline Editor", desc: "Fine-tune every segment with our professional editing tools." },
];

const FeaturesSection = () => (
  <section className="py-32 relative">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Everything you need to <span className="glow-text">dub at scale</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          A complete pipeline from raw media to production-ready dubbed content.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass-card-hover p-6 group cursor-default"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
