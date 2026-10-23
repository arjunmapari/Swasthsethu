import type { Locale, QuestionsFile, UiFile } from "@/lib/types";
import { questionsEn } from "./questions.en";
import { questionsHi } from "./questions.hi";
import { questionsMr } from "./questions.mr";
import { uiEn } from "./ui.en";
import { uiHi } from "./ui.hi";
import { uiMr } from "./ui.mr";

export const questionsByLocale: Record<Locale, QuestionsFile> = {
  en: questionsEn,
  hi: questionsHi,
  mr: questionsMr,
};

export const uiByLocale: Record<Locale, UiFile> = {
  en: uiEn,
  hi: uiHi,
  mr: uiMr,
};

export const LOCALES: Locale[] = ["en", "hi", "mr"];

export function getQuestion(file: QuestionsFile, id: string) {
  const q = file.questions.find((item) => item.id === id);
  if (!q) throw new Error(`Missing question: ${id}`);
  return q;
}
