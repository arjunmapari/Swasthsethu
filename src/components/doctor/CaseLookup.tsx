"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeCaseId, normalizePatientCode } from "@/lib/caseId";

export function CaseLookup() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const caseId = normalizeCaseId(value);
    if (caseId) return router.push(`/doctor/${caseId}`);
    const patientId = normalizePatientCode(value);
    if (patientId) return router.push(`/doctor/patient/${patientId}`);
    setError("That doesn't look like an ID. A case ID looks like SS-7K4M-9QXD and a patient ID like PT-7K4M-9QXD.");
  };

  return (
    <form onSubmit={submit} className="rounded-[1.4rem] bg-cream p-5 shadow-xl">
      <label htmlFor="case-id" className="text-sm font-medium">
        Open a case or a patient by ID
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="case-id"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="SS-XXXX-XXXX or PT-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border border-ink/20 bg-white px-4 py-3 font-mono tracking-wider outline-none focus:border-clay"
        />
        <button type="submit" className="rounded-full bg-clay px-6 font-medium text-cream hover:bg-clay-deep">
          Open
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-clay-deep">
          {error}
        </p>
      )}
    </form>
  );
}
