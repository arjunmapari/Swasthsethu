import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/types";
import { getSessionUser, homeFor } from "./auth";

const toLogin = (next: string) => `/login?next=${encodeURIComponent(next)}`;

export async function requirePatient(next: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(toLogin(next));
  if (user.role !== "patient") redirect(homeFor(user.role));
  return user;
}

export async function requireStaff(next: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(toLogin(next));
  if (user.role === "patient") redirect("/patient");
  return user;
}

export async function requireAdmin(next: string): Promise<SessionUser> {
  const user = await requireStaff(next);
  if (user.role !== "admin") redirect("/doctor");
  return user;
}
