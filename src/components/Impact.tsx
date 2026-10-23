"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function Impact() {
  const { ui } = useLanguage();

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:px-10">
      <p className="text-sm uppercase tracking-[0.18em] text-clay">{ui.landing.impactKicker}</p>
      <h2 className="mt-3 max-w-2xl font-display text-3xl text-ink md:text-4xl">{ui.landing.impactTitle}</h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {ui.landing.stats.map((stat, i) => (
          <motion.article
            key={stat.value}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-[1.6rem] border border-ink/8 bg-cream/60 p-7"
          >
            <p className="font-display text-4xl text-clay md:text-5xl">{stat.value}</p>
            <p className="mt-3 text-lg text-ink/70">{stat.label}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
