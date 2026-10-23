import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import type { Role, SessionUser } from "@/lib/types";
import { findUserById } from "./users";

export const SESSION_COOKIE = "ss_session";

const isProd = process.env.NODE_ENV === "production";
const DEV_SECRET = "dev-only-secret-change-me";
// Patients come back days later, so they stay signed in longer than staff.
const HOURS: Record<Role, number> = { patient: 24 * 7, doctor: 8, admin: 8 };

function secret(): string | null {
  return process.env.SESSION_SECRET || (isProd ? null : DEV_SECRET);
}

/** False in production until SESSION_SECRET is set (and DATABASE_URL, checked on first query). */
export function authConfigured(): boolean {
  return secret() !== null;
}

const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");

function safeEqual(a: string, b: string) {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function createSessionToken(user: { id: string; role: Role }, sessionVersion: number): string {
  const key = secret();
  if (!key) throw new Error("SESSION_SECRET is not configured");
  const payload = Buffer.from(JSON.stringify({ uid: user.id, sv: sessionVersion, exp: Date.now() + HOURS[user.role] * 3600_000 })).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export function cookieOptionsFor(role: Role) {
  return { httpOnly: true, sameSite: "lax" as const, secure: isProd, path: "/", maxAge: HOURS[role] * 3600 };
}

export const clearedCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: isProd, path: "/", maxAge: 0 };

/**
 * The signed-in user, or null. The cookie only names the user; role and "still active"
 * are read from the database every time, so disabling an account takes effect at once.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const key = secret();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !key) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, sign(payload, key))) return null;
  let data: { uid?: unknown; sv?: unknown; exp?: unknown };
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data.uid !== "string" || typeof data.exp !== "number" || data.exp <= Date.now()) return null;
  const user = await findUserById(data.uid);
  if (!user || !user.active || user.session_version !== data.sv) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, patientCode: user.patient_code };
});

export const isStaff = (u: SessionUser | null): boolean => u?.role === "doctor" || u?.role === "admin";

/** Where each role lands after signing in. */
export const homeFor = (role: Role) => (role === "patient" ? "/patient" : role === "admin" ? "/admin" : "/doctor");
