"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { STEP_INDEX, type DemoState } from "@/lib/demoReducer";
import { useLanguage } from "@/context/LanguageContext";

const slide = {
  initial: { opacity: 0, x: 36, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -28, scale: 0.98 },
};

export function KioskShell({
  state,
  children,
  onBack,
}: {
  state: DemoState;
  children: ReactNode;
  onBack?: () => void;
}) {
  const { ui } = useLanguage();
  const n = STEP_INDEX[state.step];
  const label = ui.demo.stepOf.replace("{n}", String(n));

  return (
    <div className="min-h-[100svh] bg-[#141c1b] text-cream">
      <div className="mx-auto flex min-h-[100svh] max-w-[480px] flex-col border-x border-white/5 bg-gradient-to-b from-[#1c2a28] to-[#121918] shadow-[0_0_80px_rgba(0,0,0,0.45)] md:max-w-[430px]">
        <div className="flex items-center justify-between px-5 pt-5">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-cream/70 transition hover:bg-white/8 hover:text-cream"
            >
              <ArrowLeft size={16} />
              {ui.demo.back}
            </button>
          ) : (
            <Link href="/" className="text-sm text-cream/50 hover:text-cream">
              Swasthsethu
            </Link>
          )}
          <p className="text-xs tracking-wide text-cream/45">{label}</p>
        </div>
        <div className="mt-3 flex justify-center gap-1.5 px-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < n ? "bg-clay" : "bg-white/12"}`}
            />
          ))}
        </div>
        <div className="relative flex-1 overflow-y-auto px-5 pb-8 pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.step + state.locale}
              variants={slide}
              initial="initial"
              animate="animate"
              exit="exit"
              // Shared kiosk step transition — keep duration in lockstep
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
