"use client";

import { LOCALES } from "@/data";
import type { Locale } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

const names: Record<Locale, { primary: string; secondary: string }> = {
  en: { primary: "English", secondary: "अंग्रेज़ी · इंग्रजी" },
  hi: { primary: "हिंदी", secondary: "Hindi · हिंदी" },
  mr: { primary: "मराठी", secondary: "Marathi · मराठी" },
};

export function StepLanguage({ onPick }: { onPick: (locale: Locale) => void }) {
  const { ui } = useLanguage();

  return (
    <div className="flex min-h-[70vh] flex-col justify-center">
      <p className="text-sm uppercase tracking-[0.16em] text-clay-soft">{ui.demo.languageHint}</p>
      <h1 className="mt-3 font-display text-4xl leading-tight text-cream">{ui.demo.languageTitle}</h1>
      <p className="mt-3 text-cream/65">{ui.demo.languageSub}</p>
      <div className="mt-10 space-y-3">
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onPick(code)}
            className="flex w-full items-center justify-between rounded-3xl bg-cream px-5 py-5 text-left text-ink shadow-lg transition hover:scale-[1.015] hover:bg-white active:scale-[0.985]"
          >
            <span>
              <span className="block font-display text-2xl">{names[code].primary}</span>
              <span className="text-sm text-ink/50">{names[code].secondary}</span>
            </span>
            <span className="rounded-full bg-ink px-3 py-1 text-xs text-cream">{ui.locales[code]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
