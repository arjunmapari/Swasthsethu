import { getSessionUser, isStaff } from "@/server/auth";
import { error } from "@/server/http";
import { readUpload } from "@/server/store";

export const runtime = "nodejs";

/** Doctors/admins, or the patient who uploaded it. Never public. */
export async function GET(_req: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in required.");
  const found = await readUpload((await params).fileId);
  if (!found || (!isStaff(user) && found.ownerId !== user.id)) return error(404, "File not found.");
  return new Response(new Uint8Array(found.data), {
    headers: {
      "Content-Type": found.mime,
      "Content-Length": String(found.data.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
