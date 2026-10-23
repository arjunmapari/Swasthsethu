"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { KioskShell } from "./KioskShell";
import { StepConsent, StepDeclined } from "./StepConsent";
import { StepDoctor } from "./StepDoctor";
import { StepGenerate } from "./StepGenerate";
import { StepIntake } from "./StepIntake";
import { StepLanguage } from "./StepLanguage";
import { StepScan } from "./StepScan";
import { useLanguage } from "@/context/LanguageContext";
import { demoReducer, initialDemoState, type DemoState } from "@/lib/demoReducer";
import { HttpError, saveCase } from "@/lib/api";
import { uuid } from "@/lib/uuid";
import type { Locale } from "@/lib/types";

export function DemoWizard({ patientCode }: { patientCode: string | null }) {
  const { locale, setLocale } = useLanguage();
  const [state, dispatch] = useReducer(demoReducer, locale, initialDemoState);

  const go = (step: DemoState["step"]) => dispatch({ type: "GO", step });

  const back = () => {
    if (state.step === "consent") go("language");
    else if (state.step === "intake" || state.step === "scan") dispatch({ type: "UNDO" });
    else if (state.step === "declined") go("consent");
  };

  const reset = () => dispatch({ type: "RESET", locale: state.locale, requestId: uuid() });
  const onGenerateDone = useCallback(() => dispatch({ type: "GO", step: "doctor" }), []);

  // Store the finished intake and get its case ID. The guard stops React Strict
  // Mode's double effect run from sending two requests at once; the server also
  // dedupes on requestId, so a retry after a dropped connection is safe.
  const inFlight = useRef(false);
  const save = useCallback(async (s: DemoState) => {
    if (inFlight.current) return;
    inFlight.current = true;
    dispatch({ type: "SAVE_START" });
    try {
      const { caseId } = await saveCase({
        requestId: s.requestId,
        locale: s.locale,
        answers: s.answers.map(({ questionId, optionId, label }) => ({ questionId, optionId, label })),
        documents: s.documents.map((d) => ({
          id: d.id,
          name: d.name,
          kind: d.kind,
          extractedTitle: d.extractedTitle,
          extractedDetail: d.extractedDetail,
          flag: d.flag,
          sampleUrl: d.sampleUrl,
          fileId: d.fileId,
        })),
      });
      dispatch({ type: "SAVE_OK", caseId });
    } catch (err) {
      // Signed out meanwhile (session expired): go sign in again. Answers can't be kept across the redirect.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (err instanceof HttpError && err.status === 401) window.location.href = "/login?next=/demo";
      dispatch({ type: "SAVE_FAIL" });
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (state.step === "generate" && state.saveStatus === "idle") void save(state);
  }, [state, save]);

  const showBack =
    state.step === "consent" ||
    state.step === "intake" ||
    state.step === "scan" ||
    state.step === "declined";

  return (
    <KioskShell state={state} onBack={showBack ? back : undefined}>
      {state.step === "language" && (
        <StepLanguage
          onPick={(next: Locale) => {
            setLocale(next);
            dispatch({ type: "SET_LOCALE", locale: next });
            go("consent");
          }}
        />
      )}
      {state.step === "consent" && (
        <StepConsent onAgree={() => go("intake")} onDecline={() => go("declined")} />
      )}
      {state.step === "declined" && (
        <StepDeclined onRestart={reset} />
      )}
      {state.step === "intake" && (
        <StepIntake
          state={state}
          onListening={(listening) => dispatch({ type: "SET_LISTENING", listening })}
          onAnswer={(payload) => dispatch({ type: "ANSWER", ...payload })}
        />
      )}
      {state.step === "scan" && (
        <StepScan
          locale={state.locale}
          documents={state.documents}
          onAdd={(doc) => dispatch({ type: "ADD_DOC", doc })}
          onSkip={() => go("generate")}
          onContinue={() => go("generate")}
        />
      )}
      {state.step === "generate" && (
        <StepGenerate
          saveStatus={state.saveStatus}
          onDone={onGenerateDone}
          onRetry={() => void save(state)}
          onContinueUnsaved={onGenerateDone}
        />
      )}
      {state.step === "doctor" && (
        <StepDoctor state={state} patientCode={patientCode} />
      )}
    </KioskShell>
  );
}
