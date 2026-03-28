import { motion } from "framer-motion";

const WaveformAnimation = () => {
  const bars = 40;

  return (
    <div className="flex items-center justify-center gap-[3px] h-32 opacity-60">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-primary to-accent"
          initial={{ height: 8 }}
          animate={{
            height: [8, Math.random() * 80 + 20, 8],
          }}
          transition={{
            duration: 1.5 + Math.random() * 1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
};

export default WaveformAnimation;
