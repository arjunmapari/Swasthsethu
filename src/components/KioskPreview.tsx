"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Waveform } from "./Waveform";
import { useLanguage } from "@/context/LanguageContext";

const CYCLE_MS = 5200;

export function KioskPreview() {
  const { ui, locale } = useLanguage();
  const [phase, setPhase] = useState<"ask" | "listen" | "reply">("ask");

  useEffect(() => {
    // Restart the looping demo animation from its first beat.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("ask");
    const t1 = window.setTimeout(() => setPhase("listen"), 1400);
    const t2 = window.setTimeout(() => setPhase("reply"), 3000);
    const loop = window.setInterval(() => {
      setPhase("ask");
      window.setTimeout(() => setPhase("listen"), 1400);
      window.setTimeout(() => setPhase("reply"), 3000);
    }, CYCLE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearInterval(loop);
    };
  }, [locale]);

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="absolute -inset-6 rounded-[2.2rem] bg-ink/6 blur-2xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-cream shadow-[0_30px_60px_-28px_rgba(28,42,40,0.45)]">
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="font-display text-sm text-ink/50">{ui.landing.brand}</span>
          <Waveform active={phase !== "ask"} bars={6} className="h-5" />
        </div>
        <div className="min-h-[220px] px-5 pb-6 pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={locale + phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {phase === "ask" && (
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink px-4 py-3 text-cream">
                  <p className="text-[15px] leading-snug">{ui.landing.previewQuestion}</p>
                </div>
              )}
              {phase === "listen" && (
                <div className="flex items-center gap-3 rounded-2xl border border-clay/30 bg-clay/10 px-4 py-3">
                  <Waveform active bars={8} />
                  <span className="text-sm text-clay">{ui.landing.previewListening}</span>
                </div>
              )}
              {phase === "reply" && (
                <div className="flex flex-col gap-3">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink px-4 py-3 text-cream">
                    <p className="text-[15px] leading-snug">{ui.landing.previewQuestion}</p>
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-teal px-4 py-3 text-cream">
                    <p className="text-[15px] leading-snug">{ui.landing.previewReply}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-ink/8 px-4 py-3">
          <span className="rounded-full bg-ink/6 px-3 py-2 text-center text-xs text-ink/70">Chest pain</span>
          <span className="rounded-full bg-ink/6 px-3 py-2 text-center text-xs text-ink/70">Fever</span>
        </div>
      </div>
    </div>
  );
}
