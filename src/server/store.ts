// Cases and uploaded photos, stored in Postgres.
import { randomUUID } from "node:crypto";
import { CASE_ID_ALPHABET, isCaseId } from "@/lib/caseId";
import { randomBytes } from "node:crypto";
import type { CaseListItem, CaseRecord, CaseStatus, NewCase } from "@/lib/types";
import { isUniqueViolation, query } from "./db";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const UPLOAD_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export type UploadMime = (typeof UPLOAD_MIMES)[number];

function randomCaseId() {
  const chars = Array.from(randomBytes(8), (b) => CASE_ID_ALPHABET[b % CASE_ID_ALPHABET.length]).join("");
  return `SS-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

type CaseRow = {
  id: string;
  patient_id: string;
  status: CaseStatus;
  locale: CaseRecord["locale"];
  urgent: boolean;
  chief_complaint: string;
  chief_complaint_en: string | null;
  flags: string[];
  answers: CaseRecord["answers"];
  documents: CaseRecord["documents"];
  created_at: Date;
  updated_at: Date;
  patient_code: string;
  patient_name: string;
  patient_email: string;
};

const CASE_SELECT = `
  SELECT c.*, u.patient_code, u.name AS patient_name, u.email AS patient_email
  FROM cases c JOIN users u ON u.id = c.patient_id`;

const toRecord = (r: CaseRow): CaseRecord => ({
  id: r.id,
  patientId: r.patient_id,
  patientCode: r.patient_code,
  patientName: r.patient_name,
  patientEmail: r.patient_email,
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at.toISOString(),
  locale: r.locale,
  status: r.status,
  chiefComplaint: r.chief_complaint,
  chiefComplaintEn: r.chief_complaint_en ?? undefined,
  answers: r.answers,
  documents: r.documents,
  flags: r.flags,
  urgent: r.urgent,
});

const toListItem = (r: CaseRow): CaseListItem => ({
  id: r.id,
  createdAt: r.created_at.toISOString(),
  locale: r.locale,
  status: r.status,
  chiefComplaint: r.chief_complaint,
  chiefComplaintEn: r.chief_complaint_en ?? undefined,
  patientCode: r.patient_code,
  patientName: r.patient_name,
  flagCount: r.flags.length,
  documentCount: r.documents.length,
  urgent: r.urgent,
});

// ---------- cases ----------

export class RequestIdReusedError extends Error {}

export async function createCase(patientId: string, input: NewCase, requestId: string): Promise<CaseRecord> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const id = randomCaseId();
    try {
      await query(
        `INSERT INTO cases (id, patient_id, request_id, locale, urgent, chief_complaint, chief_complaint_en, flags, answers, documents)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb)`,
        [id, patientId, requestId, input.locale, input.urgent === true, input.chiefComplaint, input.chiefComplaintEn ?? null, JSON.stringify(input.flags), JSON.stringify(input.answers), JSON.stringify(input.documents)],
      );
      return (await getCase(id))!;
    } catch (err) {
      if (isUniqueViolation(err, "request_id")) throw new RequestIdReusedError();
      if (isUniqueViolation(err, "pkey")) continue; // ID collision: draw another
      throw err;
    }
  }
  throw new Error("Could not allocate a unique case ID");
}

export async function getCase(id: string): Promise<CaseRecord | null> {
  if (!isCaseId(id)) return null;
  const r = await query<CaseRow>(`${CASE_SELECT} WHERE c.id = $1`, [id]);
  return r.rows[0] ? toRecord(r.rows[0]) : null;
}

/** A retried submission gets the same case back. Scoped to the patient so IDs can't be probed. */
export async function findCaseByRequest(patientId: string, requestId: string): Promise<CaseRecord | null> {
  if (!UUID_RE.test(requestId)) return null;
  const r = await query<CaseRow>(`${CASE_SELECT} WHERE c.request_id = $1 AND c.patient_id = $2`, [requestId, patientId]);
  return r.rows[0] ? toRecord(r.rows[0]) : null;
}

/** Staff queue: every case still open, plus the most recently completed ones. */
export async function listQueue(limit = 50): Promise<CaseListItem[]> {
  const open = await query<CaseRow>(`${CASE_SELECT} WHERE c.status <> 'completed' ORDER BY c.created_at DESC LIMIT 500`);
  const done = await query<CaseRow>(`${CASE_SELECT} WHERE c.status = 'completed' ORDER BY c.created_at DESC LIMIT $1`, [limit]);
  return [...open.rows, ...done.rows].map(toListItem);
}

/** One patient's whole history, newest first. */
export async function listCasesForPatient(patientId: string, limit = 200): Promise<CaseListItem[]> {
  const r = await query<CaseRow>(`${CASE_SELECT} WHERE c.patient_id = $1 ORDER BY c.created_at DESC LIMIT $2`, [patientId, limit]);
  return r.rows.map(toListItem);
}

export async function updateCaseStatus(id: string, status: CaseStatus): Promise<CaseRecord | null> {
  const r = await query("UPDATE cases SET status = $2, updated_at = now() WHERE id = $1", [id, status]);
  return r.rowCount ? getCase(id) : null;
}

// ---------- uploads (photos live in the database: Vercel's disk is read-only) ----------

export async function saveUpload(ownerId: string, data: Buffer, mime: UploadMime): Promise<string> {
  const id = randomUUID();
  await query("INSERT INTO uploads (id, owner_id, mime, data) VALUES ($1,$2,$3,$4)", [id, ownerId, mime, data]);
  return id;
}

export async function readUpload(fileId: string): Promise<{ data: Buffer; mime: UploadMime; ownerId: string } | null> {
  if (!UUID_RE.test(fileId)) return null;
  const r = await query<{ data: Buffer; mime: UploadMime; owner_id: string }>("SELECT data, mime, owner_id FROM uploads WHERE id = $1", [fileId]);
  return r.rows[0] ? { data: r.rows[0].data, mime: r.rows[0].mime, ownerId: r.rows[0].owner_id } : null;
}

export async function uploadOwnedBy(fileId: string, ownerId: string): Promise<boolean> {
  if (!UUID_RE.test(fileId)) return false;
  const r = await query("SELECT 1 FROM uploads WHERE id = $1 AND owner_id = $2", [fileId, ownerId]);
  return (r.rowCount ?? 0) > 0;
}
