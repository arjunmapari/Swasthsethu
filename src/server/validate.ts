import { LOCALES, questionsByLocale } from "@/data";
import { deriveFlags, isUrgent } from "@/lib/summary";
import type { DemoAnswer, Locale, NewCase, StoredAnswer, StoredDocument } from "@/lib/types";
import { UUID_RE, uploadOwnedBy } from "./store";

const SAMPLE_URLS = new Set(["/samples/prescription.svg", "/samples/lab-report.svg"]);
const DOC_KINDS = new Set(["prescription", "lab", "other"]);
const MAX_ANSWERS = 60;
const MAX_DOCS = 10;

type Result = { ok: true; requestId: string; record: NewCase } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Trim, drop control characters, cap length. Returns null when empty/not a string. */
function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const clean = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return clean.length > 0 && clean.length <= max ? clean : null;
}

/** `ownerId` is the signed-in patient: they may only attach photos they uploaded themselves. */
export async function parseCreateCase(body: unknown, ownerId: string): Promise<Result> {
  if (!isObj(body)) return { ok: false, error: "Body must be a JSON object." };

  const requestId = body.requestId;
  if (typeof requestId !== "string" || !UUID_RE.test(requestId)) return { ok: false, error: "requestId must be a UUID." };

  const locale = body.locale as Locale;
  if (!LOCALES.includes(locale)) return { ok: false, error: "Unknown locale." };

  if (!Array.isArray(body.answers) || body.answers.length < 1 || body.answers.length > MAX_ANSWERS) {
    return { ok: false, error: "answers must be a non-empty list." };
  }
  const file = questionsByLocale[locale];
  const fileEn = questionsByLocale.en;

  const answers: StoredAnswer[] = [];
  const seen = new Set<string>();
  // Answers must walk the question script in order, from the start to the end. This
  // keeps a case from mixing two complaints (e.g. chest answers plus fever answers).
  let expected = file.startId;
  for (const raw of body.answers) {
    if (!isObj(raw) || typeof raw.questionId !== "string") return { ok: false, error: "Invalid answer." };
    const q = file.questions.find((item) => item.id === raw.questionId);
    if (!q) return { ok: false, error: `Unknown question: ${raw.questionId}` };
    if (seen.has(q.id)) return { ok: false, error: `Duplicate answer for ${q.id}` };
    seen.add(q.id);
    if (q.id !== expected) return { ok: false, error: `Answers are out of order: expected ${expected}, got ${q.id}.` };
    const qEn = fileEn.questions.find((item) => item.id === q.id);

    let stored: StoredAnswer;
    if (raw.optionId !== undefined) {
      const opt = q.options.find((o) => o.id === raw.optionId);
      if (typeof raw.optionId !== "string" || !opt) return { ok: false, error: `Unknown option for ${q.id}` };
      // Trust the script, not the client, for scripted answers.
      const optEn = qEn?.options.find((o) => o.id === opt.id);
      stored = { questionId: q.id, optionId: opt.id, label: opt.label, labelEn: optEn?.label, prompt: q.prompt, promptEn: qEn?.prompt ?? q.prompt, phase: q.phase };
      expected = opt.nextId;
    } else {
      // The kiosk lets patients type or speak on every question, so any question accepts text.
      const label = text(raw.label, 500);
      if (!label) return { ok: false, error: `Free-text answer for ${q.id} is empty or too long.` };
      stored = { questionId: q.id, label, prompt: q.prompt, promptEn: qEn?.prompt ?? q.prompt, phase: q.phase };
      expected = q.freeTextNextId ?? q.options[0]?.nextId ?? "END"; // same routing as the kiosk
    }
    answers.push(stored);
  }

  if (expected !== "END") return { ok: false, error: "The intake is incomplete." };

  const documents: StoredDocument[] = [];
  const rawDocs = body.documents ?? [];
  if (!Array.isArray(rawDocs) || rawDocs.length > MAX_DOCS) return { ok: false, error: `At most ${MAX_DOCS} documents.` };
  for (const raw of rawDocs) {
    if (!isObj(raw)) return { ok: false, error: "Invalid document." };
    const id = typeof raw.id === "string" && /^[\w-]{1,64}$/.test(raw.id) ? raw.id : null;
    const name = text(typeof raw.name === "string" ? raw.name.split(/[\\/]/).pop() : raw.name, 120);
    const extractedTitle = text(raw.extractedTitle, 120);
    const extractedDetail = text(raw.extractedDetail, 300);
    const flag = raw.flag === undefined ? undefined : text(raw.flag, 120);
    if (!id || !name || !extractedTitle || !extractedDetail || flag === null) return { ok: false, error: "Invalid document fields." };
    if (typeof raw.kind !== "string" || !DOC_KINDS.has(raw.kind)) return { ok: false, error: "Invalid document kind." };

    const doc: StoredDocument = { id, name, kind: raw.kind as StoredDocument["kind"], extractedTitle, extractedDetail, ...(flag ? { flag } : {}) };
    if (typeof raw.sampleUrl === "string") {
      if (!SAMPLE_URLS.has(raw.sampleUrl)) return { ok: false, error: "Unknown sample document." };
      doc.sampleUrl = raw.sampleUrl;
    } else if (typeof raw.fileId === "string") {
      if (!(await uploadOwnedBy(raw.fileId, ownerId))) return { ok: false, error: "Uploaded file not found." };
      doc.fileId = raw.fileId;
    } else {
      return { ok: false, error: "Document needs a sampleUrl or fileId." };
    }
    documents.push(doc);
  }

  const complaint = answers.find((a) => a.questionId === "complaint");
  // "Something else" is useless in a queue; show what the patient actually described.
  const detail = complaint?.optionId === "other" ? answers.find((a) => a.questionId === "other_describe") : undefined;
  const headline = detail ?? complaint ?? answers[0];

  const asDemo: DemoAnswer[] = answers.map(({ questionId, optionId, label }) => ({ questionId, optionId, label }));
  return {
    ok: true,
    requestId,
    record: {
      locale,
      chiefComplaint: headline.label,
      chiefComplaintEn: headline.labelEn,
      answers,
      documents,
      flags: deriveFlags(asDemo, "en"),
      urgent: isUrgent(asDemo),
    },
  };
}
