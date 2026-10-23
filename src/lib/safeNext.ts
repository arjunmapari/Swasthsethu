/** Only follow same-site paths after sign-in, never "//evil.com" or "https://…". */
export function safeNext(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.includes("\\") || v.length > 200) return undefined;
  return v;
}
