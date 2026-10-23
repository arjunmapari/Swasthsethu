import { getSessionUser } from "@/server/auth";
import { error, json, sameOrigin } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { saveUpload, type UploadMime } from "@/server/store";

export const runtime = "nodejs";

// Vercel rejects request bodies over 4.5 MB, so stay under that. The kiosk shrinks photos first.
const MAX_BYTES = 4 * 1024 * 1024;

/** Identify the real format from the first bytes; the client's Content-Type is not trusted. */
function sniff(b: Buffer): UploadMime | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

/** A signed-in patient uploads a photo of a prescription or report. Returns its fileId. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return error(403, "Cross-site request blocked.");
  const user = await getSessionUser();
  if (!user) return error(401, "Please sign in to upload.");
  if (user.role !== "patient") return error(403, "Only patients can upload documents.");

  const limit = await rateLimit(`upload:${user.id}`, 30, 60);
  if (!limit.ok) return error(429, "Too many uploads. Try again shortly.", { "Retry-After": String(limit.retryAfter) });

  const declared = Number(req.headers.get("content-length"));
  if (declared > MAX_BYTES + 100_000) return error(413, "File too large (max 4 MB).");

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return error(400, "Expected multipart form data with a 'file' field.");
  }
  if (!(file instanceof File)) return error(400, "Missing 'file' field.");
  if (file.size === 0) return error(400, "File is empty.");
  if (file.size > MAX_BYTES) return error(413, "File too large (max 4 MB).");

  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniff(data);
  if (!mime) return error(415, "Only JPEG, PNG or WebP images are accepted.");

  return json({ fileId: await saveUpload(user.id, data, mime) }, { status: 201 });
}
