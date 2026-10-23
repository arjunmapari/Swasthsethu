"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { ui } = useLanguage();

  return (
    <footer className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:px-10">
      <p className="text-sm uppercase tracking-[0.18em] text-clay">{ui.landing.teamKicker}</p>
      <h2 className="mt-3 font-display text-3xl text-ink">{ui.landing.teamTitle}</h2>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/70">{ui.landing.teamBody}</p>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-8">
        <p className="text-sm text-ink/45">{ui.landing.footerNote}</p>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-sm text-ink/55 hover:text-ink hover:underline">
            Sign in
          </Link>
          <Link href="/demo" className="text-sm font-medium text-clay hover:underline">
            {ui.landing.navDemo} →
          </Link>
        </div>
      </div>
    </footer>
  );
}
