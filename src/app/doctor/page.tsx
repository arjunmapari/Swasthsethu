import { AutoRefresh } from "@/components/doctor/AutoRefresh";
import { CaseLookup } from "@/components/doctor/CaseLookup";
import { VisitList } from "@/components/doctor/VisitList";
import { sortQueue } from "@/lib/queue";
import { requireStaff } from "@/server/guards";
import { listQueue } from "@/server/store";

export const dynamic = "force-dynamic";

export default async function DoctorHome() {
  await requireStaff("/doctor");
  const cases = sortQueue(await listQueue(50));
  const waiting = cases.filter((c) => c.status === "new").length;

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <CaseLookup />
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl">Recent cases</h2>
          <p className="text-sm text-ink/50">{waiting} waiting</p>
        </div>
        {cases.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-cream px-5 py-8 text-center text-ink/50">No cases yet. They appear here as patients finish their intake.</p>
        ) : (
          <VisitList cases={cases} showPatient />
        )}
      </section>
    </div>
  );
}
