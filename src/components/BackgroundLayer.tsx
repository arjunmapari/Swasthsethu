"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

/** Persistent living background — parallax speed shifts with scroll. */
export function BackgroundLayer() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  // Faster drift as you leave the hero (0 → 1 maps to milder → stronger offset)
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 12]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-paper" />
      <div className="grain absolute inset-0 opacity-40 mix-blend-multiply" />

      <motion.div style={{ y: ySlow, rotate }} className="absolute -left-24 top-[-10%] h-[52vw] w-[52vw] max-w-[640px]">
        <div
          className="h-full w-full rounded-full bg-clay/25 blur-3xl"
          style={{ transform: "translate(var(--mx, 0px), var(--my, 0px))" }}
        />
      </motion.div>

      <motion.div style={{ y: yFast }} className="absolute -right-20 top-[18%] h-[40vw] w-[40vw] max-w-[520px]">
        <div className="h-full w-full rounded-full bg-teal/20 blur-3xl" />
      </motion.div>

      <motion.div
        style={{ y: ySlow }}
        className="absolute bottom-[-8%] left-[20%] h-[36vw] w-[36vw] max-w-[460px]"
      >
        <div className="h-full w-full rounded-[40%] bg-clay-soft/50 blur-3xl" />
      </motion.div>

      <svg className="absolute inset-x-0 bottom-0 h-40 w-full opacity-40" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path d="M0 80 Q 150 20 300 80 T 600 80 T 900 80 T 1200 80" fill="none" stroke="#c45c3e" strokeWidth="1.4" strokeOpacity="0.45">
          <animate
            attributeName="d"
            dur="8s"
            begin="0s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
            values="M0 80 Q 150 20 300 80 T 600 80 T 900 80 T 1200 80;M0 80 Q 150 120 300 80 T 600 80 T 900 80 T 1200 80;M0 80 Q 150 20 300 80 T 600 80 T 900 80 T 1200 80"
          />
        </path>
        <path d="M0 100 Q 200 60 400 100 T 800 100 T 1200 100" fill="none" stroke="#3d7a73" strokeWidth="1.2" strokeOpacity="0.35">
          <animate
            attributeName="d"
            dur="11s"
            begin="0.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
            values="M0 100 Q 200 60 400 100 T 800 100 T 1200 100;M0 100 Q 200 140 400 100 T 800 100 T 1200 100;M0 100 Q 200 60 400 100 T 800 100 T 1200 100"
          />
        </path>
      </svg>
    </div>
  );
}
