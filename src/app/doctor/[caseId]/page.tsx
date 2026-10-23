import Link from "next/link";
import { redirect } from "next/navigation";
import { CaseSummary } from "@/components/case/CaseSummary";
import { StatusActions } from "@/components/doctor/StatusActions";
import { StatusBadge } from "@/components/doctor/StatusBadge";
import { VisitList } from "@/components/doctor/VisitList";
import { uiByLocale } from "@/data";
import { normalizeCaseId, safeDecode } from "@/lib/caseId";
import { viewFromRecord } from "@/lib/caseView";
import { LOCALE_NAMES, formatWhen } from "@/lib/format";
import { requireStaff } from "@/server/guards";
import { getCase, listCasesForPatient } from "@/server/store";

export const dynamic = "force-dynamic";

export default async function CasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const raw = safeDecode((await params).caseId);
  await requireStaff(`/doctor/${raw}`);

  const id = normalizeCaseId(raw);
  if (id && id !== raw) redirect(`/doctor/${id}`); // e.g. lower-case or missing dashes
  const record = id ? await getCase(id) : null;

  if (!record) {
    return (
      <div className="rounded-[1.4rem] bg-cream p-8 text-center shadow-xl">
        <h1 className="font-display text-2xl">Case not found</h1>
        <p className="mt-2 text-ink/60">No case matches <span className="font-mono">{raw}</span>. Check the ID the patient was shown.</p>
        <Link href="/doctor" className="mt-5 inline-block rounded-full bg-clay px-5 py-2.5 font-medium text-cream hover:bg-clay-deep">Back to cases</Link>
      </div>
    );
  }

  const earlier = (await listCasesForPatient(record.patientId, 20)).filter((c) => c.id !== record.id);

  return (
    <div className="space-y-5">
      <Link href="/doctor" className="text-sm text-ink/60 hover:text-ink">← All cases</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl tracking-wider">{record.id}</h1>
          <p className="mt-1 text-sm text-ink/55">Submitted {formatWhen(record.createdAt)} · Patient language: {LOCALE_NAMES[record.locale]}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="rounded-2xl bg-cream px-5 py-4 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-ink/40">Patient</p>
        <p className="mt-1 text-lg font-medium">{record.patientName}</p>
        <p className="text-sm text-ink/60">
          <Link href={`/doctor/patient/${record.patientCode}`} className="font-mono text-clay hover:underline">{record.patientCode}</Link> · {record.patientEmail}
        </p>
      </div>

      {record.urgent && (
        <p role="alert" className="rounded-xl bg-clay px-4 py-3 font-medium text-cream">
          Urgent: the patient was told to alert the front desk. Review the red flags below first.
        </p>
      )}
      <StatusActions caseId={record.id} status={record.status} />
      <CaseSummary view={viewFromRecord(record)} copy={uiByLocale.en.demo} />

      {earlier.length > 0 && (
        <section>
          <h2 className="font-display text-xl">Earlier visits by {record.patientName}</h2>
          <VisitList cases={earlier} />
        </section>
      )}
    </div>
  );
}
