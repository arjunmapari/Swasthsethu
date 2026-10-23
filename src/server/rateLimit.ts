import { query } from "./db";

// Counted in Postgres, not memory: on Vercel every request may land on a different
// server instance, so an in-memory counter would never add up.
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; retryAfter: number }> {
  // Lets the automated tests run many sign-ups quickly. Ignored in production, whatever it is set to.
  if (process.env.NODE_ENV !== "production" && process.env.RATE_LIMIT_OFF === "1") return { ok: true, retryAfter: 0 };
  const r = await query<{ n: string; oldest: Date | null }>(
    "SELECT count(*) AS n, min(at) AS oldest FROM rate_events WHERE key = $1 AND at > now() - make_interval(secs => $2)",
    [key, windowSec],
  );
  const n = Number(r.rows[0].n);
  if (n >= limit) {
    const oldest = r.rows[0].oldest?.getTime() ?? Date.now();
    return { ok: false, retryAfter: Math.max(1, Math.ceil(windowSec - (Date.now() - oldest) / 1000)) };
  }
  await recordEvent(key);
  return { ok: true, retryAfter: 0 };
}

export async function countEvents(key: string, windowSec: number): Promise<number> {
  const r = await query<{ n: string }>("SELECT count(*) AS n FROM rate_events WHERE key = $1 AND at > now() - make_interval(secs => $2)", [key, windowSec]);
  return Number(r.rows[0].n);
}

export async function recordEvent(key: string) {
  await query("INSERT INTO rate_events (key) VALUES ($1)", [key]);
  if (Math.random() < 0.02) await query("DELETE FROM rate_events WHERE at < now() - interval '1 day'");
}

export async function clearEvents(key: string) {
  await query("DELETE FROM rate_events WHERE key = $1", [key]);
}
