import { normalizeCaseId } from "@/lib/caseId";
import type { CaseStatus } from "@/lib/types";
import { getSessionUser, isStaff } from "@/server/auth";
import { error, json, sameOrigin } from "@/server/http";
import { getCase, updateCaseStatus } from "@/server/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ caseId: string }> };
const STATUSES: CaseStatus[] = ["new", "in_consultation", "completed"];

/** Staff can open any case. A patient can open only their own; anything else looks like "not found". */
export async function GET(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in required.");
  const id = normalizeCaseId((await params).caseId);
  const record = id ? await getCase(id) : null;
  if (!record || (!isStaff(user) && record.patientId !== user.id)) return error(404, "Case not found.");
  return json(record);
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return error(403, "Cross-site request blocked.");
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in required.");
  if (!isStaff(user)) return error(403, "Only doctors can change a case's status.");
  const id = normalizeCaseId((await params).caseId);
  if (!id) return error(404, "Case not found.");

  const body = await req.json().catch(() => null);
  const status = body?.status as CaseStatus | undefined;
  if (!status || !STATUSES.includes(status)) return error(400, `status must be one of ${STATUSES.join(", ")}.`);

  const updated = await updateCaseStatus(id, status);
  return updated ? json(updated) : error(404, "Case not found.");
}
