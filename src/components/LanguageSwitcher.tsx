"use client";

import { motion } from "framer-motion";
import { LOCALES } from "@/data";
import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/types";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, ui } = useLanguage();

  return (
    <div
      className={`relative flex rounded-full bg-ink/8 p-1 ${compact ? "scale-90" : ""}`}
      role="tablist"
      aria-label="Language"
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setLocale(code as Locale)}
            className="relative z-10 min-w-[2.6rem] rounded-full px-3 py-1.5 text-sm font-medium tracking-wide"
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-full bg-ink shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className={`relative ${active ? "text-paper" : "text-ink/70"}`}>
              {ui.locales[code]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
