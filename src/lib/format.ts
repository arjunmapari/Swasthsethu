import type { CaseStatus, Locale } from "@/lib/types";

const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
export const formatWhen = (iso: string) => fmt.format(new Date(iso));

export const LOCALE_NAMES: Record<Locale, string> = { en: "English", hi: "हिन्दी · Hindi", mr: "मराठी · Marathi" };

export const STATUS_LABEL: Record<CaseStatus, string> = {
  new: "Waiting",
  in_consultation: "In consultation",
  completed: "Completed",
};
