import { NextResponse } from "next/server";

export function json(data: unknown, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export function error(status: number, message: string, headers?: Record<string, string>) {
  return json({ error: message }, { status, headers });
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** CSRF guard for cookie-authenticated writes: a browser always sends Origin on cross-site POSTs. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl, scripts)
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
