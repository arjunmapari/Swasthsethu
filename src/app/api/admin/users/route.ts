import { getSessionUser } from "@/server/auth";
import { error, json, sameOrigin } from "@/server/http";
import { checkPasswordStrength } from "@/server/password";
import { EMAIL_RE, EmailTakenError, createUser, listStaffAndPatients, toPublic } from "@/server/users";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (user?.role !== "admin") return error(user ? 403 : 401, "Admins only.");
  return json({ users: await listStaffAndPatients() });
}

/** Admin creates a doctor (or another admin) account. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "Cross-site request blocked.");
  const user = await getSessionUser();
  if (user?.role !== "admin") return error(user ? 403 : 401, "Admins only.");

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role === "admin" ? "admin" : body?.role === "doctor" ? "doctor" : null;

  if (!role) return error(400, "Role must be doctor or admin.");
  if (name.length < 1 || name.length > 100) return error(400, "Enter the person's name.");
  if (email.length > 254 || !EMAIL_RE.test(email)) return error(400, "Enter a valid email address.");
  const weak = checkPasswordStrength(password);
  if (weak) return error(400, weak);

  try {
    return json({ user: toPublic(await createUser({ email, name, password, role })) }, { status: 201 });
  } catch (err) {
    if (err instanceof EmailTakenError) return error(409, "That email already has an account.");
    throw err;
  }
}
