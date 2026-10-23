// Postgres connection + automatic schema setup.
//
// Works with any Postgres: Vercel Postgres / Neon, Supabase, Railway, or a local server.
// Set POSTGRES_URL (what Vercel's Neon integration creates) or DATABASE_URL.
import { Pool, type QueryResultRow } from "pg";

/** Turns a connection string into pool settings. Exported so it can be unit-tested. */
export function poolConfigFor(raw: string, env: Record<string, string | undefined> = process.env) {
  const url = new URL(raw);
  // pg lets "sslmode" in the URL override our ssl setting, so we take it out and decide here.
  url.searchParams.delete("sslmode");
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const wantsNoSsl = raw.includes("sslmode=disable") || env.DATABASE_SSL === "off";
  const ssl = local || wantsNoSsl ? false : { rejectUnauthorized: env.DATABASE_SSL !== "no-verify" };
  return { connectionString: url.toString(), ssl };
}

function connectionConfig() {
  const raw = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL (or POSTGRES_URL) is not set. See .env.example.");
  return poolConfigFor(raw);
}

const g = globalThis as unknown as { __ssPool?: Pool; __ssSchema?: Promise<void> };

function pool(): Pool {
  if (!g.__ssPool) {
    const { connectionString, ssl } = connectionConfig();
    // Serverless functions each hold their own pool, so keep it small.
    g.__ssPool = new Pool({ connectionString, ssl, max: 4, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 });
    g.__ssPool.on("error", (err) => console.error("Postgres pool error:", err.message));
  }
  return g.__ssPool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('patient','doctor','admin')),
  patient_code text,
  active boolean NOT NULL DEFAULT true,
  session_version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_patient_code_key ON users (patient_code) WHERE patient_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS cases (
  id text PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES users(id),
  request_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_consultation','completed')),
  locale text NOT NULL,
  urgent boolean NOT NULL DEFAULT false,
  chief_complaint text NOT NULL,
  chief_complaint_en text,
  flags jsonb NOT NULL DEFAULT '[]',
  answers jsonb NOT NULL,
  documents jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cases_patient_idx ON cases (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cases_status_idx ON cases (status, created_at);

CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  mime text NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_events (
  key text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_events_key_idx ON rate_events (key, at);
`;

/** Creates the tables on first use. Safe to run many times, and safe if two servers start together. */
export function ensureSchema(): Promise<void> {
  g.__ssSchema ??= (async () => {
    const client = await pool().connect();
    try {
      // A transaction-level lock: it is released by COMMIT on the same connection, so it also
      // works behind poolers such as Neon's (a session-level lock could leak there).
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(727001)");
      await client.query(SCHEMA);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => null);
      throw err;
    } finally {
      client.release();
    }
  })().catch((err) => {
    g.__ssSchema = undefined; // try again on the next request
    throw err;
  });
  return g.__ssSchema;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  await ensureSchema();
  return pool().query<T>(text, params);
}

export async function closePool() {
  await g.__ssPool?.end();
  g.__ssPool = undefined;
  g.__ssSchema = undefined;
}

export function isUniqueViolation(err: unknown, constraintHint?: string): boolean {
  const e = err as { code?: string; constraint?: string };
  return e?.code === "23505" && (!constraintHint || (e.constraint ?? "").includes(constraintHint));
}
