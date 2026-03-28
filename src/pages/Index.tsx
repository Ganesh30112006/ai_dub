import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import { motion } from "framer-motion";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <HeroSection />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
    >
      <FeaturesSection />
    </motion.div>
    <motion.footer
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="border-t border-border py-12 text-center text-sm text-muted-foreground"
    >
      © 2026 DubFlow. AI-Powered Audio Dubbing.
    </motion.footer>
  </div>
);

export default Index;
