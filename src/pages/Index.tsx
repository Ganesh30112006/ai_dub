import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <FeaturesSection />
    <footer className="border-t border-border py-12 text-center text-sm text-muted-foreground">
      © 2026 DubFlow. AI-Powered Audio Dubbing.
    </footer>
  </div>
);

export default Index;
