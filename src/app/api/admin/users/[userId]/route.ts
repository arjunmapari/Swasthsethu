import { getSessionUser } from "@/server/auth";
import { error, json, sameOrigin } from "@/server/http";
import { checkPasswordStrength } from "@/server/password";
import { activeAdminCount, findUserById, setActive, setPassword, toPublic } from "@/server/users";

export const runtime = "nodejs";

/** Admin: disable/enable an account, or set a new password. Either one signs that person out everywhere. */
export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!sameOrigin(req)) return error(403, "Cross-site request blocked.");
  const me = await getSessionUser();
  if (me?.role !== "admin") return error(me ? 403 : 401, "Admins only.");

  const target = await findUserById((await params).userId);
  if (!target) return error(404, "User not found.");
  const body = await req.json().catch(() => null);

  if (typeof body?.password === "string") {
    const weak = checkPasswordStrength(body.password);
    if (weak) return error(400, weak);
    return json({ user: toPublic((await setPassword(target.id, body.password))!) });
  }
  if (typeof body?.active === "boolean") {
    if (!body.active && target.id === me.id) return error(400, "You can't disable your own account.");
    if (!body.active && target.role === "admin" && (await activeAdminCount()) <= 1) return error(400, "At least one admin must stay active.");
    return json({ user: toPublic((await setActive(target.id, body.active))!) });
  }
  return error(400, "Send { active: boolean } or { password: string }.");
}
