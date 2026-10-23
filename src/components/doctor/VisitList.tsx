import Link from "next/link";
import { StatusBadge } from "@/components/doctor/StatusBadge";
import { LOCALE_NAMES, formatWhen } from "@/lib/format";
import type { CaseListItem } from "@/lib/types";

/** Rows of cases. `showPatient` adds the patient's name and ID (used in the queue). */
export function VisitList({ cases, showPatient = false }: { cases: CaseListItem[]; showPatient?: boolean }) {
  return (
    <ul className="mt-3 space-y-2">
      {cases.map((c) => (
        <li key={c.id}>
          <Link href={`/doctor/${c.id}`} className="flex items-center justify-between gap-4 rounded-2xl bg-cream px-5 py-4 shadow-sm transition hover:shadow-md">
            <div className="min-w-0">
              <p className="truncate font-medium">{c.chiefComplaintEn ?? c.chiefComplaint}</p>
              <p className="mt-0.5 text-sm text-ink/50">
                {showPatient && <><span className="text-ink/70">{c.patientName}</span> · <span className="font-mono">{c.patientCode}</span> · </>}
                <span className="font-mono">{c.id}</span> · {formatWhen(c.createdAt)} · {LOCALE_NAMES[c.locale]}
                {c.documentCount > 0 && ` · ${c.documentCount} doc${c.documentCount > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {c.urgent && <span className="rounded-full bg-clay-deep px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cream">Urgent</span>}
              {c.flagCount > 0 && <span className="rounded-full bg-clay px-2.5 py-1 text-xs font-medium text-cream">{c.flagCount} flag{c.flagCount > 1 ? "s" : ""}</span>}
              <StatusBadge status={c.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
