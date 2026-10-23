"use client";

import { useLanguage } from "@/context/LanguageContext";

export function StepConsent({
  onAgree,
  onDecline,
}: {
  onAgree: () => void;
  onDecline: () => void;
}) {
  const { ui } = useLanguage();

  return (
    <div className="flex min-h-[70vh] flex-col">
      <h1 className="font-display text-3xl leading-tight text-cream">{ui.demo.consentTitle}</h1>
      <ul className="mt-8 space-y-4">
        {ui.demo.consentBody.map((line) => (
          <li key={line} className="rounded-2xl bg-white/6 px-4 py-4 text-[17px] leading-relaxed text-cream/85">
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-auto space-y-3 pt-10">
        <button
          type="button"
          onClick={onAgree}
          className="w-full rounded-full bg-clay py-4 text-lg font-medium text-cream shadow-[0_12px_24px_-12px_rgba(196,92,62,0.9)] transition hover:scale-[1.02] hover:bg-clay-deep active:scale-[0.98]"
        >
          {ui.demo.consentAgree}
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="w-full rounded-full border border-white/15 py-4 text-lg text-cream/80 transition hover:bg-white/8"
        >
          {ui.demo.consentDecline}
        </button>
      </div>
    </div>
  );
}

export function StepDeclined({ onRestart }: { onRestart: () => void }) {
  const { ui } = useLanguage();

  return (
    <div className="flex min-h-[70vh] flex-col justify-center text-center">
      <h1 className="font-display text-4xl text-cream">{ui.demo.declinedTitle}</h1>
      <p className="mt-5 text-lg leading-relaxed text-cream/75">{ui.demo.declinedBody}</p>
      <p className="mt-3 text-cream/50">{ui.demo.declinedWait}</p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-10 rounded-full bg-cream px-6 py-3 font-medium text-ink transition hover:scale-[1.03]"
      >
        {ui.demo.restart}
      </button>
    </div>
  );
}
