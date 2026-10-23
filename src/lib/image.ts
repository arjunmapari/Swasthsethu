export class UnsupportedImageError extends Error {}

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Phone cameras produce 5–12 MB photos. Shrink to at most 1800px on the long
 * edge as JPEG before uploading — still very readable for a prescription.
 * Anything the browser can't decode and that isn't JPEG/PNG/WebP is rejected.
 */
export async function prepareImage(file: File, maxEdge = 1800, quality = 0.85): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    if (!ALLOWED.has(file.type)) throw new UnsupportedImageError();
    return file;
  }

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && ALLOWED.has(file.type) && file.size <= 2_000_000) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.fillStyle = "#fff"; // JPEG has no alpha; avoid black backgrounds from transparent PNGs
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  return blob ?? file;
}
