import { useMemo } from "react";
import { motion } from "framer-motion";

const WaveformAnimation = () => {
  const bars = 40;
  const heights = useMemo(() => {
    return Array.from({ length: bars }, () => ({
      peak: Math.random() * 80 + 20,
      duration: 1.5 + Math.random() * 1,
    }));
  }, [bars]);

  return (
    <motion.div
      className="flex items-center justify-center gap-[3px] h-32 opacity-60"
      animate={{ opacity: [0.45, 0.65, 0.45] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-primary to-accent"
          initial={{ height: 8 }}
          animate={{
            height: [8, heights[i].peak, 8],
          }}
          transition={{
            duration: heights[i].duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05,
          }}
        />
      ))}
    </motion.div>
  );
};

export default WaveformAnimation;
