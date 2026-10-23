"use client";

import { useLanguage } from "@/context/LanguageContext";

export function Roadmap() {
  const { ui } = useLanguage();

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 md:px-10">
      <p className="text-sm uppercase tracking-[0.18em] text-teal">{ui.landing.roadmapKicker}</p>
      <h2 className="mt-3 max-w-2xl font-display text-3xl text-ink md:text-4xl">{ui.landing.roadmapTitle}</h2>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/70">{ui.landing.roadmapBody}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-teal px-6 py-6 text-cream">
          <p className="text-xs uppercase tracking-widest text-cream/70">Now</p>
          <p className="mt-3 text-lg leading-relaxed">{ui.landing.roadmapNow}</p>
        </div>
        <div className="rounded-3xl bg-ink px-6 py-6 text-cream">
          <p className="text-xs uppercase tracking-widest text-clay-soft">Next</p>
          <p className="mt-3 text-lg leading-relaxed">{ui.landing.roadmapNext}</p>
        </div>
      </div>
    </section>
  );
}
