"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CaseStatus } from "@/lib/types";

const NEXT: Record<CaseStatus, { to: CaseStatus; label: string } | null> = {
  new: { to: "in_consultation", label: "Start consultation" },
  in_consultation: { to: "completed", label: "Mark completed" },
  completed: null,
};

export function StatusActions({ caseId, status }: { caseId: string; status: CaseStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const move = async (to: CaseStatus) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Update failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const next = NEXT[status];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {next && (
        <button
          type="button"
          disabled={busy}
          onClick={() => move(next.to)}
          className="rounded-full bg-clay px-5 py-2.5 font-medium text-cream hover:bg-clay-deep disabled:opacity-50"
        >
          {next.label}
        </button>
      )}
      {status !== "new" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => move("new")}
          className="rounded-full border border-ink/20 px-4 py-2.5 text-sm text-ink/70 hover:bg-ink/5 disabled:opacity-50"
        >
          Back to waiting
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-clay-deep">
          {error}
        </p>
      )}
    </div>
  );
}
