"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { accountCopy } from "@/data/account.copy";
import { formatWhen } from "@/lib/format";
import type { CaseListItem } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { SignOutButton } from "./SignOutButton";

export function PatientHome({ name, patientCode, cases }: { name: string; patientCode: string; cases: CaseListItem[] }) {
  const { locale } = useLanguage();
  const t = accountCopy[locale];

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink">Swasthsethu</Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <SignOutButton label={t.signOut} />
        </div>
      </div>

      <h1 className="font-display text-3xl text-ink">{t.hello}, {name}</h1>

      <section className="mt-5 rounded-[1.4rem] bg-cream p-5 shadow-xl">
        <p className="text-xs uppercase tracking-widest text-ink/45">{t.yourPatientId}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-mono text-3xl tracking-wider text-ink">{patientCode}</p>
          <CopyButton value={patientCode} label={t.copy} doneLabel={t.copied} />
        </div>
        <p className="mt-2 text-sm text-ink/55">{t.patientIdHint}</p>
      </section>

      <Link href="/demo" className="mt-5 block rounded-full bg-clay py-4 text-center text-lg font-medium text-cream transition hover:bg-clay-deep">
        {t.startVisit}
      </Link>

      <h2 className="mt-10 font-display text-xl text-ink">{t.previousVisits}</h2>
      {cases.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-cream px-5 py-8 text-center text-ink/50">{t.noVisits}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {cases.map((c) => (
            <li key={c.id}>
              <Link href={`/patient/cases/${c.id}`} className="flex items-center justify-between gap-4 rounded-2xl bg-cream px-5 py-4 shadow-sm transition hover:shadow-md">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{c.chiefComplaint}</p>
                  <p className="mt-0.5 text-sm text-ink/50"><span className="font-mono">{c.id}</span> · {formatWhen(c.createdAt)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-ink/8 px-2.5 py-1 text-xs font-medium text-ink/70">{t.status[c.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
