import { notFound } from "next/navigation";
import { PatientVisit } from "@/components/account/PatientVisit";
import { normalizeCaseId, safeDecode } from "@/lib/caseId";
import { requirePatient } from "@/server/guards";
import { getCase } from "@/server/store";

export const dynamic = "force-dynamic";

export default async function PatientCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const raw = safeDecode((await params).caseId);
  const user = await requirePatient(`/patient/cases/${raw}`);
  const id = normalizeCaseId(raw);
  const record = id ? await getCase(id) : null;
  // Someone else's case looks exactly like a case that doesn't exist.
  if (!record || record.patientId !== user.id) notFound();
  return <PatientVisit record={record} />;
}
