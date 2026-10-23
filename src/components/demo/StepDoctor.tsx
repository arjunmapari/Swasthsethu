"use client";

import Link from "next/link";
import { CaseSummary } from "@/components/case/CaseSummary";
import { CopyButton } from "@/components/account/CopyButton";
import { SignOutButton } from "@/components/account/SignOutButton";
import { useLanguage } from "@/context/LanguageContext";
import { accountCopy } from "@/data/account.copy";
import { viewFromState } from "@/lib/caseView";
import type { DemoState } from "@/lib/demoReducer";
import { isUrgent } from "@/lib/summary";

export function StepDoctor({ state, patientCode }: { state: DemoState; patientCode: string | null }) {
  const { ui } = useLanguage();
  const t = accountCopy[state.locale];
  const saved = state.caseId !== null;

  return (
    <div className="pb-4">
      {isUrgent(state.answers) && (
        <p role="alert" className="mb-4 rounded-xl bg-clay px-4 py-3 text-base font-medium text-cream">
          {ui.demo.urgentNotice}
        </p>
      )}
      {saved ? (
        <section className="space-y-4 rounded-[1.4rem] border border-clay/40 bg-white/6 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-clay-soft">{ui.demo.caseIdLabel}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-2xl tracking-wider text-cream">{state.caseId}</p>
              <CopyButton value={state.caseId ?? ""} label={ui.demo.caseIdCopy} doneLabel={ui.demo.caseIdCopied} />
            </div>
          </div>
          {patientCode && (
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-clay-soft">{t.yourPatientId}</p>
              <p className="mt-1 font-mono text-xl tracking-wider text-cream">{patientCode}</p>
            </div>
          )}
          <p className="text-sm text-cream/60">{ui.demo.caseIdHint}</p>
        </section>
      ) : (
        <p className="rounded-xl bg-clay/15 px-4 py-3 text-sm text-clay-soft">{ui.demo.notSavedNote}</p>
      )}

      <p className="mt-6 text-xs uppercase tracking-[0.18em] text-clay-soft">{ui.demo.doctorEyebrow}</p>
      <h1 className="mt-2 font-display text-3xl text-cream">{ui.demo.doctorTitle}</h1>
      <p className="mt-1 text-sm text-cream/45">{ui.demo.doctorPatient}</p>

      <div className="mt-6">
        <CaseSummary view={viewFromState(state)} copy={ui.demo} />
      </div>

      <Link
        href="/patient"
        className="mt-6 block w-full rounded-full bg-clay py-4 text-center text-lg font-medium text-cream transition hover:scale-[1.02] active:scale-[0.98]"
      >
        {t.viewMyVisits}
      </Link>
      <SignOutButton label={t.signOut} className="mt-3 w-full py-3 text-cream/60 hover:text-cream" />
    </div>
  );
}
