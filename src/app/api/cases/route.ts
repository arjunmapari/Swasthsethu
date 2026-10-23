import { getSessionUser, isStaff } from "@/server/auth";
import { error, json, sameOrigin } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { RequestIdReusedError, createCase, findCaseByRequest, listCasesForPatient, listQueue } from "@/server/store";
import { parseCreateCase } from "@/server/validate";

export const runtime = "nodejs";

const MAX_BODY = 200_000;

/** A signed-in patient saves a finished intake to their own record and gets a case ID. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "Cross-site request blocked.");
  const user = await getSessionUser();
  if (!user) return error(401, "Please sign in to save your visit.");
  if (user.role !== "patient") return error(403, "Only patients can submit an intake.");

  const limit = await rateLimit(`create:${user.id}`, 20, 60);
  if (!limit.ok) return error(429, "Too many requests. Try again shortly.", { "Retry-After": String(limit.retryAfter) });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return error(413, "Payload too large.");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return error(400, "Body must be valid JSON.");
  }

  const parsed = await parseCreateCase(body, user.id);
  if (!parsed.ok) return error(400, parsed.error);

  // A retry of the same submission returns the original case instead of a duplicate.
  const existing = await findCaseByRequest(user.id, parsed.requestId);
  if (existing) return json({ caseId: existing.id, patientCode: user.patientCode, createdAt: existing.createdAt });

  try {
    const record = await createCase(user.id, parsed.record, parsed.requestId);
    return json({ caseId: record.id, patientCode: user.patientCode, createdAt: record.createdAt }, { status: 201 });
  } catch (err) {
    if (err instanceof RequestIdReusedError) {
      // Two identical submissions raced (double tap, flaky-network retry): the other one won.
      // Hand back the case it created instead of an error.
      const won = await findCaseByRequest(user.id, parsed.requestId);
      if (won) return json({ caseId: won.id, patientCode: user.patientCode, createdAt: won.createdAt });
      return error(409, "This submission ID was already used.");
    }
    throw err;
  }
}

/** Staff: the waiting queue. Patient: their own visits, newest first. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in required.");
  const limit = Math.min(200, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 50));
  return json({ cases: isStaff(user) ? await listQueue(limit) : await listCasesForPatient(user.id, limit) });
}
