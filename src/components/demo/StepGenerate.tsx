"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Waveform } from "@/components/Waveform";
import { useLanguage } from "@/context/LanguageContext";
import type { DemoState } from "@/lib/demoReducer";

const MIN_BEAT_MS = 3400; // keep the reveal in the 2–4s range

export function StepGenerate({
  saveStatus,
  onDone,
  onRetry,
  onContinueUnsaved,
}: {
  saveStatus: DemoState["saveStatus"];
  onDone: () => void;
  onRetry: () => void;
  onContinueUnsaved: () => void;
}) {
  const { ui } = useLanguage();
  const [beatDone, setBeatDone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setBeatDone(true), MIN_BEAT_MS);
    return () => window.clearTimeout(t);
  }, []);

  // Move on only once the animation has played AND the case is safely stored.
  useEffect(() => {
    if (beatDone && saveStatus === "saved") onDone();
  }, [beatDone, saveStatus, onDone]);

  if (saveStatus === "error") {
    return (
      <div className="flex min-h-[70vh] flex-col justify-center">
        <h1 className="font-display text-3xl text-cream">{ui.demo.saveFailedTitle}</h1>
        <p className="mt-3 text-cream/70">{ui.demo.saveFailedBody}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-8 w-full rounded-full bg-clay py-4 text-lg font-medium text-cream transition hover:scale-[1.02] active:scale-[0.98]"
        >
          {ui.demo.saveRetry}
        </button>
        <button type="button" onClick={onContinueUnsaved} className="mt-3 w-full py-3 text-cream/60 hover:text-cream">
          {ui.demo.saveContinue}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col justify-center">
      <div className="mb-6 flex items-center gap-3">
        <Waveform active bars={12} />
        <p className="text-sm uppercase tracking-[0.16em] text-clay-soft">{ui.demo.generateSub}</p>
      </div>
      <h1 className="font-display text-3xl text-cream">{ui.demo.generateTitle}</h1>
      <ul className="mt-10 space-y-3">
        {ui.demo.generateSections.map((section, i) => (
          <motion.li
            key={section}
            initial={{ opacity: 0, x: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.35 + i * 0.55, duration: 0.45 }}
            className="rounded-2xl bg-cream px-4 py-4 text-ink"
          >
            <span className="text-xs text-clay">{String(i + 1).padStart(2, "0")}</span>
            <p className="font-display text-xl">{section}</p>
          </motion.li>
        ))}
      </ul>
      {beatDone && saveStatus === "saving" && <p className="mt-6 text-sm text-cream/55">{ui.demo.generateSaving}</p>}
    </div>
  );
}
