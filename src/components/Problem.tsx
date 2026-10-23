"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function Problem() {
  const { ui, locale } = useLanguage();

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:px-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={locale}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-sm uppercase tracking-[0.18em] text-clay">{ui.landing.problemKicker}</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-ink md:text-4xl">
            {ui.landing.problemTitle}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <div className="rounded-3xl border border-ink/10 bg-cream/70 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-ink/40">{ui.landing.problemBeforeTitle}</p>
              <p className="mt-4 text-lg leading-relaxed text-ink/75">{ui.landing.problemBefore}</p>
              <div className="mt-6 space-y-2 text-sm text-ink/45">
                <p>Name? Complaint? How long? Medicines? Papers?</p>
                <div className="h-2 w-full rounded bg-ink/8" />
                <div className="h-2 w-4/5 rounded bg-ink/8" />
              </div>
            </div>
            <div className="hidden items-center justify-center md:flex">
              <span className="font-display text-3xl text-clay">→</span>
            </div>
            <div className="rounded-3xl bg-ink p-6 text-cream shadow-lg">
              <p className="text-xs uppercase tracking-widest text-cream/50">{ui.landing.problemAfterTitle}</p>
              <p className="mt-4 text-lg leading-relaxed text-cream/90">{ui.landing.problemAfter}</p>
              <div className="mt-6 rounded-2xl bg-cream/10 p-4 text-sm">
                <p className="text-clay-soft">Chest pain · 1 night · 7/10</p>
                <p className="mt-1 text-cream/70">Radiates to left arm · SOB on walking</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
