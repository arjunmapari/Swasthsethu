import { DemoWizard } from "@/components/demo/DemoWizard";
import { requirePatient } from "@/server/guards";

export const dynamic = "force-dynamic";

/** The intake kiosk. Patients sign in first, so every visit is saved to their own account. */
export default async function DemoPage() {
  const user = await requirePatient("/demo");
  return <DemoWizard patientCode={user.patientCode} />;
}
