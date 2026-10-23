// Case IDs look like SS-7K4M-9QXD. The alphabet drops 0/O/1/I/L so an ID read
// aloud or copied from a screen is hard to mistype. 32^8 ≈ 1.1 trillion IDs.
export const CASE_ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CASE_ID_RE = /^SS-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/;

/** Turns "ss 7k4m 9qxd", "SS7K4M9QXD" etc. into "SS-7K4M-9QXD"; null if not an ID. */
export function normalizeCaseId(input: string): string | null {
  const raw = input.toUpperCase().replace(/[\s-]+/g, "");
  const body = raw.startsWith("SS") ? raw.slice(2) : raw;
  if (body.length !== 8) return null;
  const id = `SS-${body.slice(0, 4)}-${body.slice(4)}`;
  return CASE_ID_RE.test(id) ? id : null;
}

export function isCaseId(input: string): boolean {
  return CASE_ID_RE.test(input);
}

const PATIENT_CODE_RE = /^PT-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/;

/** "pt 7k4m 9qxd", "PT7K4M9QXD" -> "PT-7K4M-9QXD"; null if it is not a patient ID. */
export function normalizePatientCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[\s-]+/g, "");
  if (!raw.startsWith("PT") || raw.length !== 10) return null;
  const id = `PT-${raw.slice(2, 6)}-${raw.slice(6)}`;
  return PATIENT_CODE_RE.test(id) ? id : null;
}

/** decodeURIComponent throws on malformed input like "%E0%A4%A"; a bad address should be "not found", not a crash. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
