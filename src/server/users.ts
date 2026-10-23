import { randomBytes, randomUUID } from "node:crypto";
import { CASE_ID_ALPHABET } from "@/lib/caseId";
export { normalizePatientCode } from "@/lib/caseId";
import type { Role } from "@/lib/types";
import { isUniqueViolation, query } from "./db";
import { hashPassword } from "./password";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  patient_code: string | null;
  active: boolean;
  session_version: number;
  created_at: Date;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  patientCode: string | null;
  active: boolean;
  createdAt: string;
};

function randomPatientCode() {
  const chars = Array.from(randomBytes(8), (b) => CASE_ID_ALPHABET[b % CASE_ID_ALPHABET.length]).join("");
  return `PT-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

export const toPublic = (u: UserRow): PublicUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  patientCode: u.patient_code,
  active: u.active,
  createdAt: u.created_at.toISOString(),
});

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const r = await query<UserRow>("SELECT * FROM users WHERE lower(email) = $1", [normalizeEmail(email)]);
  return r.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const r = await query<UserRow>("SELECT * FROM users WHERE id = $1", [id]);
  return r.rows[0] ?? null;
}

export async function findPatientByCode(code: string): Promise<UserRow | null> {
  const r = await query<UserRow>("SELECT * FROM users WHERE patient_code = $1 AND role = 'patient'", [code]);
  return r.rows[0] ?? null;
}

export class EmailTakenError extends Error {}

export async function createUser(input: { email: string; name: string; password: string; role: Role }): Promise<UserRow> {
  const password_hash = await hashPassword(input.password);
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const r = await query<UserRow>(
        `INSERT INTO users (id, email, name, password_hash, role, patient_code)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [randomUUID(), normalizeEmail(input.email), input.name.trim(), password_hash, input.role, input.role === "patient" ? randomPatientCode() : null],
      );
      return r.rows[0];
    } catch (err) {
      if (isUniqueViolation(err, "email")) throw new EmailTakenError();
      if (isUniqueViolation(err, "patient_code")) continue; // astronomically rare; draw a new code
      throw err;
    }
  }
  throw new Error("Could not allocate a unique patient ID");
}

export async function listStaffAndPatients(): Promise<PublicUser[]> {
  const r = await query<UserRow>("SELECT * FROM users ORDER BY (role = 'patient'), created_at DESC LIMIT 500");
  return r.rows.map(toPublic);
}

export async function countByRole(): Promise<Record<Role, number>> {
  const r = await query<{ role: Role; n: string }>("SELECT role, count(*) AS n FROM users GROUP BY role");
  const out: Record<Role, number> = { patient: 0, doctor: 0, admin: 0 };
  for (const row of r.rows) out[row.role] = Number(row.n);
  return out;
}

/** Disabling an account or changing its password signs it out everywhere (session_version bumps). */
export async function setActive(id: string, active: boolean): Promise<UserRow | null> {
  const r = await query<UserRow>("UPDATE users SET active = $2, session_version = session_version + 1 WHERE id = $1 RETURNING *", [id, active]);
  return r.rows[0] ?? null;
}

export async function setPassword(id: string, password: string): Promise<UserRow | null> {
  const r = await query<UserRow>("UPDATE users SET password_hash = $2, session_version = session_version + 1 WHERE id = $1 RETURNING *", [id, await hashPassword(password)]);
  return r.rows[0] ?? null;
}

export async function activeAdminCount(): Promise<number> {
  const r = await query<{ n: string }>("SELECT count(*) AS n FROM users WHERE role = 'admin' AND active");
  return Number(r.rows[0].n);
}
