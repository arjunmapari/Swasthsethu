import { STATUS_LABEL } from "@/lib/format";
import type { CaseStatus } from "@/lib/types";

const TONE: Record<CaseStatus, string> = {
  new: "bg-clay/15 text-clay-deep",
  in_consultation: "bg-teal/15 text-teal-deep",
  completed: "bg-ink/10 text-ink/60",
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}
