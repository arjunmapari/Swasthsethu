import type { Metadata } from "next";
import { PatientHome } from "@/components/account/PatientHome";
import { requirePatient } from "@/server/guards";
import { listCasesForPatient } from "@/server/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My visits — Swasthsethu", robots: { index: false, follow: false } };

export default async function PatientPage() {
  const user = await requirePatient("/patient");
  const cases = await listCasesForPatient(user.id);
  return <PatientHome name={user.name} patientCode={user.patientCode ?? ""} cases={cases} />;
}
