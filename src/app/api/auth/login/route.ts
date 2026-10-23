import { SESSION_COOKIE, authConfigured, cookieOptionsFor, createSessionToken, homeFor } from "@/server/auth";
import { clientIp, error, json, sameOrigin } from "@/server/http";
import { DUMMY_HASH, verifyPassword } from "@/server/password";
import { clearEvents, countEvents, rateLimit, recordEvent } from "@/server/rateLimit";
import { findUserByEmail, normalizeEmail, toPublic } from "@/server/users";

export const runtime = "nodejs";

/** One sign-in for patients, doctors and admins. The role decides where they land. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "Cross-site request blocked.");
  if (!authConfigured()) return error(503, "Sign-in is not configured. Set SESSION_SECRET.");

  const ipLimit = await rateLimit(`login-ip:${clientIp(req)}`, 60, 60);
  if (!ipLimit.ok) return error(429, "Too many attempts. Wait a minute and try again.", { "Retry-After": String(ipLimit.retryAfter) });

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 200) return error(400, "Enter your email and password.");

  // Lock an account's login for a while after repeated failures, whoever is guessing.
  const failKey = `login-fail:${email}`;
  if ((await countEvents(failKey, 900)) >= 8) return error(429, "Too many failed attempts for this account. Try again in 15 minutes.", { "Retry-After": "900" });

  const user = await findUserByEmail(email);
  // Always run a hash check so a wrong email and a wrong password take the same time.
  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid || !user.active) {
    await recordEvent(failKey);
    return error(401, "Incorrect email or password.");
  }

  await clearEvents(failKey);
  const res = json({ user: toPublic(user), redirect: homeFor(user.role) });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user, user.session_version), cookieOptionsFor(user.role));
  return res;
}
