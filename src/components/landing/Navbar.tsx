import { motion } from "framer-motion";
import { AudioLines } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-lg">
          <AudioLines className="h-5 w-5 text-primary" />
          <span>DubFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            Docs
          </Button>
          <Button
            size="sm"
            className="glow-button text-primary-foreground font-medium"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
