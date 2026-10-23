import { questionsByLocale } from "@/data";
import { deriveFlags } from "@/lib/summary";
import type { DemoState } from "@/lib/demoReducer";
import type { CaseRecord } from "@/lib/types";

const PATIENT_Q = new Set(["complaint", "age", "sex", "pregnancy"]);

export type SummaryDoc = {
  id: string;
  name: string;
  title: string;
  detail: string;
  flag?: string;
  imageUrl?: string;
};

export type SummaryView = {
  complaint?: string;
  /** The patient's own wording, when the headline above is an English rendering of it. */
  complaintOriginal?: string;
  /** e.g. "18–59 · Female · Possibly pregnant" */
  patientLine?: string;
  history: { q: string; a: string; original?: string }[];
  quick: { allergies?: string; medicines?: string; past?: string };
  flags: string[];
  documents: SummaryDoc[];
};

/** Live preview on the kiosk, shown in the patient's own language. */
export function viewFromState(state: DemoState): SummaryView {
  const file = questionsByLocale[state.locale];
  const byId = (id: string) => state.answers.find((a) => a.questionId === id)?.label;
  const patientLine = ["age", "sex", "pregnancy"].map(byId).filter(Boolean).join(" · ");
  return {
    complaint: byId("complaint"),
    patientLine: patientLine || undefined,
    history: state.answers
      .filter((a) => !PATIENT_Q.has(a.questionId))
      .map((a) => ({ a, q: file.questions.find((item) => item.id === a.questionId) }))
      .filter(({ q }) => q?.phase !== "closing")
      .map(({ a, q }) => ({ q: q?.prompt ?? a.questionId, a: a.label })),
    quick: { allergies: byId("allergies"), medicines: byId("medicines"), past: byId("past") },
    flags: deriveFlags(state.answers, state.locale),
    documents: state.documents.map((d) => ({
      id: d.id,
      name: d.name,
      title: d.extractedTitle,
      detail: d.extractedDetail,
      flag: d.flag,
      imageUrl: d.previewUrl,
    })),
  };
}

/** What the doctor sees: English first, with the patient's own words underneath. */
export function viewFromRecord(record: CaseRecord): SummaryView {
  const find = (id: string) => record.answers.find((a) => a.questionId === id);
  const en = (id: string) => {
    const a = find(id);
    return a ? (a.labelEn ?? a.label) : undefined;
  };
  const picked = find("complaint");
  const patientLine = ["age", "sex", "pregnancy"].map(en).filter(Boolean).join(" · ");
  return {
    complaint: record.chiefComplaintEn ?? record.chiefComplaint,
    patientLine: patientLine || undefined,
    complaintOriginal: picked?.labelEn && picked.labelEn === record.chiefComplaintEn && picked.labelEn !== picked.label ? picked.label : undefined,
    history: record.answers
      .filter((a) => !PATIENT_Q.has(a.questionId) && a.phase !== "closing")
      .map((a) => ({
        q: a.promptEn,
        a: a.labelEn ?? a.label,
        original: a.labelEn && a.labelEn !== a.label ? a.label : undefined,
      })),
    quick: { allergies: en("allergies"), medicines: en("medicines"), past: en("past") },
    flags: record.flags,
    documents: record.documents.map((d) => ({
      id: d.id,
      name: d.name,
      title: d.extractedTitle,
      detail: d.extractedDetail,
      flag: d.flag,
      imageUrl: d.fileId ? `/api/uploads/${d.fileId}` : d.sampleUrl,
    })),
  };
}

/** What a patient sees of their own past visit: their own language, no clinician-only wording. */
export function viewForPatient(record: CaseRecord): SummaryView {
  const find = (id: string) => record.answers.find((a) => a.questionId === id)?.label;
  const asDemo = record.answers.map(({ questionId, optionId, label }) => ({ questionId, optionId, label }));
  return {
    complaint: record.chiefComplaint,
    patientLine: ["age", "sex", "pregnancy"].map(find).filter(Boolean).join(" · ") || undefined,
    history: record.answers.filter((a) => !PATIENT_Q.has(a.questionId) && a.phase !== "closing").map((a) => ({ q: a.prompt, a: a.label })),
    quick: { allergies: find("allergies"), medicines: find("medicines"), past: find("past") },
    flags: deriveFlags(asDemo, record.locale),
    documents: record.documents.map((d) => ({
      id: d.id,
      name: d.name,
      title: d.extractedTitle,
      detail: d.extractedDetail,
      flag: d.flag,
      imageUrl: d.fileId ? `/api/uploads/${d.fileId}` : d.sampleUrl,
    })),
  };
}
