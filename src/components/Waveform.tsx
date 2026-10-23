"use client";

import { motion } from "framer-motion";

type WaveformProps = {
  active?: boolean;
  bars?: number;
  className?: string;
};

export function Waveform({ active = true, bars = 9, className = "" }: WaveformProps) {
  return (
    <div className={`flex h-7 items-end gap-[3px] ${className}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-clay origin-bottom"
          animate={
            active
              ? {
                  // Staggered sine-like pulse — tweak duration for slower/faster "voice"
                  height: ["28%", "100%", "40%", "85%", "28%"],
                }
              : { height: "32%" }
          }
          transition={{
            duration: active ? 0.9 + (i % 3) * 0.12 : 0.4,
            repeat: active ? Infinity : 0,
            delay: i * 0.06,
            ease: "easeInOut",
          }}
          style={{ height: 8 }}
        />
      ))}
    </div>
  );
}
