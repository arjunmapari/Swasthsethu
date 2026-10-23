import { SESSION_COOKIE, clearedCookieOptions } from "@/server/auth";
import { error, json, sameOrigin } from "@/server/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "Cross-site request blocked.");
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", clearedCookieOptions);
  return res;
}
