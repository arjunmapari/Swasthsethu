import type { CaseListItem } from "@/lib/types";

const RANK = { new: 0, in_consultation: 1, completed: 2 } as const;

/**
 * Waiting room first: urgent cases on top, then first-come-first-served.
 * Then patients already in consultation, then finished cases (newest first).
 */
export function sortQueue(cases: CaseListItem[]): CaseListItem[] {
  return [...cases].sort((a, b) => {
    if (a.status !== b.status) return RANK[a.status] - RANK[b.status];
    if (a.status === "new") {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}
