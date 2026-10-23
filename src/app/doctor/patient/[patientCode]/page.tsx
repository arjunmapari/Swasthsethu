import Link from "next/link";
import { VisitList } from "@/components/doctor/VisitList";
import { normalizePatientCode, safeDecode } from "@/lib/caseId";
import { formatWhen } from "@/lib/format";
import { requireStaff } from "@/server/guards";
import { listCasesForPatient } from "@/server/store";
import { findPatientByCode } from "@/server/users";

export const dynamic = "force-dynamic";

/** Everything one patient has ever submitted, found by their patient ID. */
export default async function PatientHistoryPage({ params }: { params: Promise<{ patientCode: string }> }) {
  const raw = safeDecode((await params).patientCode);
  await requireStaff(`/doctor/patient/${raw}`);
  const code = normalizePatientCode(raw);
  const patient = code ? await findPatientByCode(code) : null;

  if (!patient) {
    return (
      <div className="rounded-[1.4rem] bg-cream p-8 text-center shadow-xl">
        <h1 className="font-display text-2xl">Patient not found</h1>
        <p className="mt-2 text-ink/60">No patient matches <span className="font-mono">{raw}</span>.</p>
        <Link href="/doctor" className="mt-5 inline-block rounded-full bg-clay px-5 py-2.5 font-medium text-cream hover:bg-clay-deep">Back to cases</Link>
      </div>
    );
  }

  const cases = await listCasesForPatient(patient.id);
  return (
    <div className="space-y-5">
      <Link href="/doctor" className="text-sm text-ink/60 hover:text-ink">← All cases</Link>
      <div className="rounded-2xl bg-cream px-5 py-4 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-ink/40">Patient</p>
        <h1 className="mt-1 font-display text-2xl">{patient.name}</h1>
        <p className="text-sm text-ink/60"><span className="font-mono">{patient.patient_code}</span> · {patient.email} · registered {formatWhen(patient.created_at.toISOString())}</p>
      </div>
      <section>
        <h2 className="font-display text-xl">Visit history ({cases.length})</h2>
        {cases.length === 0 ? <p className="mt-3 rounded-2xl bg-cream px-5 py-8 text-center text-ink/50">This patient has not submitted an intake yet.</p> : <VisitList cases={cases} />}
      </section>
    </div>
  );
}
