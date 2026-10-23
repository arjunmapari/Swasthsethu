"use client";

import Link from "next/link";
import { CaseSummary } from "@/components/case/CaseSummary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { accountCopy } from "@/data/account.copy";
import { viewForPatient } from "@/lib/caseView";
import { formatWhen } from "@/lib/format";
import type { CaseRecord } from "@/lib/types";
import { SignOutButton } from "./SignOutButton";

export function PatientVisit({ record }: { record: CaseRecord }) {
  const { locale, ui } = useLanguage();
  const t = accountCopy[locale];

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/patient" className="text-sm text-ink/60 hover:text-ink">{t.back}</Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <SignOutButton label={t.signOut} />
        </div>
      </div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl tracking-wider text-ink">{record.id}</h1>
          <p className="mt-1 text-sm text-ink/55">{t.submitted} {formatWhen(record.createdAt)}</p>
        </div>
        <span className="rounded-full bg-ink/8 px-3 py-1 text-sm font-medium text-ink/70">{t.status[record.status]}</span>
      </div>
      <CaseSummary view={viewForPatient(record)} copy={ui.demo} />
    </div>
  );
}
