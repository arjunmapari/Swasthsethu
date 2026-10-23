import { SESSION_COOKIE, authConfigured, cookieOptionsFor, createSessionToken, homeFor } from "@/server/auth";
import { clientIp, error, json, sameOrigin } from "@/server/http";
import { checkPasswordStrength } from "@/server/password";
import { rateLimit } from "@/server/rateLimit";
import { EMAIL_RE, EmailTakenError, createUser, toPublic } from "@/server/users";

export const runtime = "nodejs";

/** A patient creates an account and is given a permanent patient ID. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "Cross-site request blocked.");
  if (!authConfigured()) return error(503, "Sign-up is not configured. Set SESSION_SECRET.");

  const limit = await rateLimit(`register-ip:${clientIp(req)}`, 60, 3600);
  if (!limit.ok) return error(429, "Too many sign-ups from this network. Try again later.", { "Retry-After": String(limit.retryAfter) });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 1 || name.length > 100) return error(400, "Please enter your name.");
  if (email.length > 254 || !EMAIL_RE.test(email)) return error(400, "Please enter a valid email address.");
  const weak = checkPasswordStrength(password);
  if (weak) return error(400, weak);

  try {
    const user = await createUser({ email, name, password, role: "patient" });
    const res = json({ user: toPublic(user), redirect: homeFor("patient") }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, createSessionToken(user, user.session_version), cookieOptionsFor("patient"));
    return res;
  } catch (err) {
    if (err instanceof EmailTakenError) return error(409, "This email is already registered. Please sign in instead.");
    throw err;
  }
}
