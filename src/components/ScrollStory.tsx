"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Waveform } from "./Waveform";
import { useLanguage } from "@/context/LanguageContext";

export function ScrollStory() {
  const { ui } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Four beats across the pin. Tweak input range to linger on a beat.
  const steps = ui.landing.storySteps;

  return (
    <section id="story" ref={ref} className="relative z-10 h-[280vh]">
      <div className="sticky top-0 flex min-h-[100svh] flex-col justify-center overflow-hidden px-5 py-16 md:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-sm uppercase tracking-[0.18em] text-teal">{ui.landing.storyKicker}</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl text-ink md:text-4xl">{ui.landing.storyTitle}</h2>
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <ol className="space-y-8">
              {steps.map((step, i) => (
                <StoryBeat key={step.title} index={i} progress={scrollYProgress} title={step.title} body={step.body} />
              ))}
            </ol>
            <StoryStage progress={scrollYProgress} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryBeat({
  index,
  progress,
  title,
  body,
}: {
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  title: string;
  body: string;
}) {
  const start = index / 4;
  const end = (index + 1) / 4;
  const opacity = useTransform(progress, [start, start + 0.08, end - 0.04, end], [0.25, 1, 1, 0.25]);
  const x = useTransform(progress, [start, start + 0.08], [-12, 0]);

  return (
    <motion.li style={{ opacity, x }} className="border-l-2 border-clay/40 pl-5">
      <p className="font-display text-xl text-ink">{title}</p>
      <p className="mt-1 max-w-md text-ink/65">{body}</p>
    </motion.li>
  );
}

function StoryStage({ progress }: { progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const rotate = useTransform(progress, [0, 1], [-4, 4]);
  const frame = useTransform(progress, [0, 0.25, 0.5, 0.75, 1], [0, 1, 2, 3, 3]);

  return (
    <motion.div
      style={{ rotate }}
      className="relative mx-auto aspect-[9/11] w-full max-w-sm overflow-hidden rounded-[1.8rem] border border-ink/10 bg-cream shadow-2xl"
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-xs uppercase tracking-widest text-ink/40">Kiosk</span>
        <Waveform bars={7} className="h-5" />
      </div>
      <motion.div className="p-5 pt-8">
        <StageCopy progress={frame} />
      </motion.div>
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-clay"
        style={{ scaleX: progress, transformOrigin: "0% 50%" }}
      />
    </motion.div>
  );
}

function StageCopy({ progress }: { progress: ReturnType<typeof useTransform<number, number>> }) {
  const labels = [
    { t: "Namaste.", s: "Choose a language. Sit. Breathe." },
    { t: "Chest pain?", s: "Since when? Does it travel? Can you breathe?" },
    { t: "Scan line…", s: "Amoxicillin 500mg · Hb 11.2 · flagged low" },
    { t: "Ready for consult.", s: "Chief complaint, flags, papers — one card." },
  ];
  const i = useTransform(progress, (v) => Math.round(v));
  return (
    <motion.div>
      <StageInner labels={labels} index={i} />
    </motion.div>
  );
}

function StageInner({
  labels,
  index,
}: {
  labels: { t: string; s: string }[];
  index: ReturnType<typeof useTransform<number, number>>;
}) {
  const t = useTransform(index, (v) => labels[Math.min(3, Math.max(0, v))]?.t ?? "");
  const s = useTransform(index, (v) => labels[Math.min(3, Math.max(0, v))]?.s ?? "");
  return (
    <>
      <motion.h3 className="font-display text-3xl text-ink">{t}</motion.h3>
      <motion.p className="mt-4 text-lg leading-relaxed text-ink/65">{s}</motion.p>
      <div className="mt-8 space-y-2">
        <div className="h-10 rounded-2xl bg-ink text-cream" />
        <div className="ml-10 h-10 rounded-2xl bg-teal/80" />
      </div>
    </>
  );
}
