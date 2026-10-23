"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label, doneLabel }: { value: string; label: string; doneLabel: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        } catch {
          /* clipboard blocked: the value is on screen anyway */
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink/8 px-3 py-2 text-sm text-ink hover:bg-ink/12"
    >
      {done ? <Check size={15} /> : <Copy size={15} />}
      {done ? doneLabel : label}
    </button>
  );
}
