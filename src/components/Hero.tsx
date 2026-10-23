"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { KioskPreview } from "./KioskPreview";
import { Waveform } from "./Waveform";
import { useLanguage } from "@/context/LanguageContext";

export function Hero() {
  const { ui, locale } = useLanguage();
  const wrap = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 });
  const sy = useSpring(my, { stiffness: 80, damping: 20 });

  return (
    <section
      ref={wrap}
      className="relative z-10 min-h-[100svh] px-5 pb-16 pt-6 md:px-10"
      onMouseMove={(e) => {
        const r = wrap.current?.getBoundingClientRect();
        if (!r) return;
        mx.set((e.clientX - r.left - r.width / 2) / 28);
        my.set((e.clientY - r.top - r.height / 2) / 28);
      }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-tight text-ink">{ui.landing.brand}</span>
          <span className="hidden text-sm text-ink/45 sm:inline">{ui.landing.brandMark}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/demo"
            className="hidden rounded-full bg-clay px-4 py-2 text-sm font-medium text-cream shadow-[0_8px_20px_-10px_rgba(196,92,62,0.9)] transition hover:scale-[1.03] hover:bg-clay-deep active:scale-[0.98] sm:inline-block"
          >
            {ui.landing.navDemo}
          </Link>
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-6xl items-center gap-12 lg:mt-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <motion.div
            key={`${locale}-eyebrow`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-teal"
          >
            <Waveform bars={5} className="h-4" />
            {ui.landing.heroEyebrow}
          </motion.div>
          <motion.h1
            key={`${locale}-h`}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="font-display text-[2.4rem] leading-[1.08] text-ink sm:text-5xl lg:text-[3.6rem]"
          >
            {ui.landing.heroHeadline}
          </motion.h1>
          <motion.p
            key={`${locale}-sub`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70"
          >
            {ui.landing.heroSub}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/demo"
              className="rounded-full bg-clay px-7 py-3.5 text-base font-medium text-cream shadow-[0_14px_28px_-12px_rgba(196,92,62,0.85)] transition hover:scale-[1.03] hover:bg-clay-deep active:scale-[0.97]"
            >
              {ui.landing.heroCta}
            </Link>
            <a
              href="#story"
              className="rounded-full border border-ink/15 px-6 py-3.5 text-base text-ink/80 transition hover:border-ink/40 hover:bg-ink/4"
            >
              {ui.landing.heroSecondary}
            </a>
          </motion.div>
        </div>

        <motion.div style={{ x: sx, y: sy }} className="lg:pt-8">
          <KioskPreview />
        </motion.div>
      </div>
    </section>
  );
}
