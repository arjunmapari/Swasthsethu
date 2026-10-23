import { getQuestion, questionsByLocale } from "@/data";
import { uuid } from "@/lib/uuid";
import type { DemoAnswer, Locale, ScannedDoc, WizardStep } from "@/lib/types";

export type DemoState = {
  step: WizardStep;
  locale: Locale;
  currentQuestionId: string;
  answers: DemoAnswer[];
  documents: ScannedDoc[];
  listening: boolean;
  /** Stays the same across retries so the server never saves the same intake twice. */
  requestId: string;
  caseId: string | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
};

export const initialDemoState = (locale: Locale, requestId: string = uuid()): DemoState => ({
  step: "language",
  locale,
  currentQuestionId: questionsByLocale[locale].startId,
  answers: [],
  documents: [],
  listening: false,
  requestId,
  caseId: null,
  saveStatus: "idle",
});

export type DemoAction =
  | { type: "SET_LOCALE"; locale: Locale }
  | { type: "GO"; step: WizardStep }
  | { type: "ANSWER"; questionId: string; optionId?: string; label: string; nextId: string | "END" }
  | { type: "ADD_DOC"; doc: ScannedDoc }
  | { type: "SET_LISTENING"; listening: boolean }
  | { type: "UNDO" }
  | { type: "SAVE_START" }
  | { type: "SAVE_OK"; caseId: string }
  | { type: "SAVE_FAIL" }
  | { type: "RESET"; locale: Locale; requestId: string };

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "SET_LOCALE": {
      const startId = questionsByLocale[action.locale].startId;
      return {
        ...state,
        locale: action.locale,
        currentQuestionId: startId,
        answers: [],
      };
    }
    case "GO":
      return { ...state, step: action.step, listening: false };
    case "ANSWER": {
      const answers = [
        ...state.answers.filter((a) => a.questionId !== action.questionId),
        { questionId: action.questionId, optionId: action.optionId, label: action.label },
      ];
      if (action.nextId === "END") {
        return { ...state, answers, step: "scan", listening: false };
      }
      // Guard missing nodes so a bad nextId never silently freezes intake.
      getQuestion(questionsByLocale[state.locale], action.nextId);
      return {
        ...state,
        answers,
        currentQuestionId: action.nextId,
        listening: false,
      };
    }
    case "UNDO": {
      // Step back one question and drop that answer, so a wrong tap can be fixed
      // without leaving answers from the abandoned branch in the case.
      const last = state.answers[state.answers.length - 1];
      if (!last) return { ...state, step: "consent", listening: false };
      return {
        ...state,
        step: "intake",
        answers: state.answers.slice(0, -1),
        currentQuestionId: last.questionId,
        listening: false,
      };
    }
    case "ADD_DOC":
      return { ...state, documents: [...state.documents, action.doc] };
    case "SET_LISTENING":
      return { ...state, listening: action.listening };
    case "SAVE_START":
      return { ...state, saveStatus: "saving" };
    case "SAVE_OK":
      return { ...state, saveStatus: "saved", caseId: action.caseId };
    case "SAVE_FAIL":
      return { ...state, saveStatus: "error" };
    case "RESET":
      return initialDemoState(action.locale, action.requestId);
    default:
      return state;
  }
}

export const STEP_INDEX: Record<WizardStep, number> = {
  language: 1,
  consent: 2,
  declined: 2,
  intake: 3,
  scan: 4,
  generate: 5,
  doctor: 6,
};
