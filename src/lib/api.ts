import type { CreateCasePayload } from "@/lib/types";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function failure(res: Response): Promise<HttpError> {
  const body = await res.json().catch(() => null);
  return new HttpError(res.status, body?.error ?? `Request failed (${res.status})`);
}

/** Saves a finished intake. Safe to retry: the server dedupes on requestId. */
export async function saveCase(payload: CreateCasePayload): Promise<{ caseId: string; patientCode: string | null }> {
  const res = await fetch("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw await failure(res);
  return res.json();
}

export async function uploadPhoto(blob: Blob, name: string): Promise<string> {
  const form = new FormData();
  form.append("file", blob, name);
  const res = await fetch("/api/uploads", { method: "POST", body: form, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw await failure(res);
  return (await res.json()).fileId as string;
}
