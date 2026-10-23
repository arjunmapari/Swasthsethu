"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mic, Send, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Waveform } from "@/components/Waveform";
import { getQuestion, questionsByLocale } from "@/data";
import type { DemoState } from "@/lib/demoReducer";
import { isUrgent } from "@/lib/summary";
import { useLanguage } from "@/context/LanguageContext";

// Maps your app's locale codes to the BCP-47 codes the browser's speech
// APIs expect. Adjust here if you add more languages later.
const VOICE_LANG: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

// The Web Speech API isn't in TypeScript's DOM lib, so describe the slice we use.
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function StepIntake({
  state,
  onAnswer,
  onListening,
}: {
  state: DemoState;
  onAnswer: (payload: { questionId: string; optionId?: string; label: string; nextId: string | "END" }) => void;
  onListening: (listening: boolean) => void;
}) {
  const { ui } = useLanguage();
  const file = questionsByLocale[state.locale];
  const question = useMemo(
    () => getQuestion(file, state.currentQuestionId),
    [file, state.currentQuestionId],
  );
  const [typed, setTyped] = useState("");
  const [showQuestion, setShowQuestion] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceLang = VOICE_LANG[state.locale] ?? "en-IN";

  useEffect(() => {
    // Reset the per-question UI whenever the question changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowQuestion(false);
    setTyped("");
    setSpeechError(null);
    // Typing indicator dwell before the assistant bubble — edit delay to taste
    const t = window.setTimeout(() => setShowQuestion(true), 720);
    return () => window.clearTimeout(t);
  }, [question.id]);

  // Speak the question out loud once its bubble appears. This is the part
  // that was completely missing before — nothing here ever called
  // speechSynthesis, so the assistant never actually spoke.
  useEffect(() => {
    if (!showQuestion) return;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(question.prompt);
    utter.lang = voiceLang;
    utter.rate = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const match =
      voices.find((v) => v.lang === voiceLang) ||
      voices.find((v) => v.lang.startsWith(voiceLang.split("-")[0]));
    if (match) utter.voice = match;
    window.speechSynthesis.speak(utter);
    return () => window.speechSynthesis.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuestion, question.id, voiceLang]);

  const submitOption = (optionId: string, label: string, nextId: string | "END") => {
    onAnswer({ questionId: question.id, optionId, label, nextId });
  };

  const submitText = () => {
    const label = typed.trim();
    if (!label) return;
    const nextId = question.freeTextNextId ?? question.options[0]?.nextId ?? "END";
    onAnswer({ questionId: question.id, label, nextId });
  };

  // Real speech capture. Whatever the patient actually says becomes the
  // answer verbatim — it is never matched against the option list, so it
  // can never be forced into a pre-written choice.
  const listen = () => {
    const speechWindow = window as SpeechWindow;
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechError("Voice input isn't supported in this browser — type your answer instead.");
      return;
    }

    setSpeechError(null);
    window.speechSynthesis?.cancel(); // don't talk over the patient
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => onListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onListening(false);
      if (!transcript || !transcript.trim()) return;
      const nextId = question.freeTextNextId ?? question.options[0]?.nextId ?? "END";
      onAnswer({ questionId: question.id, label: transcript.trim(), nextId });
    };

    recognition.onerror = (e) => {
      onListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setSpeechError("Microphone permission was blocked — allow it in the address bar and try again.");
      } else if (e.error === "no-speech") {
        setSpeechError("Didn't catch that — tap the mic and try again.");
      } else if (e.error === "language-not-supported") {
        setSpeechError(`Voice input doesn't support ${voiceLang} on this device — try typing instead.`);
      } else {
        setSpeechError("Voice input error: " + e.error);
      }
    };

    recognition.onend = () => onListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      onListening(false);
      setSpeechError("Could not start the microphone.");
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col">
      {isUrgent(state.answers) && (
        <p role="alert" className="mb-4 rounded-xl bg-clay px-4 py-3 text-base font-medium text-cream">
          {ui.demo.urgentNotice}
        </p>
      )}
      <p className="text-xs uppercase tracking-[0.16em] text-cream/40">{question.phase}</p>
      <div className="mt-4 space-y-3">
        {state.answers.slice(-3).map((a) => (
          <div key={a.questionId + a.label} className="ml-8 rounded-2xl rounded-tr-sm bg-teal/80 px-4 py-3 text-sm">
            {a.label}
          </div>
        ))}
        <AnimatePresence mode="wait">
          {!showQuestion ? (
            <motion.div
              key="dots"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-fit rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3"
            >
              <span className="inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-cream/70"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.12 }}
                  />
                ))}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl rounded-tl-sm bg-cream px-4 py-4 text-ink"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg leading-snug">{question.prompt}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!("speechSynthesis" in window)) return;
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance(question.prompt);
                    u.lang = voiceLang;
                    window.speechSynthesis.speak(u);
                  }}
                  className="mt-1 shrink-0 text-ink/40 hover:text-ink"
                  aria-label="Replay question"
                  title="Replay question"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              {question.hint && <p className="mt-2 text-sm text-ink/50">{question.hint}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showQuestion && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
          {question.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => submitOption(opt.id, opt.label, opt.nextId)}
                  className="rounded-full bg-white/10 px-4 py-3 text-left text-cream transition hover:scale-[1.03] hover:bg-clay active:scale-[0.97]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Free text is now always available, regardless of the question's
              allowFreeText flag — the patient's real words should never be
              limited to a fixed set of pre-written choices. */}
          <div className="flex gap-2">
            <input
              value={typed}
              maxLength={500}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitText()}
              placeholder={question.freeTextPlaceholder ?? ui.demo.typePlaceholder}
              className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-cream outline-none placeholder:text-cream/35"
            />
            <button
              type="button"
              onClick={submitText}
              className="rounded-full bg-cream p-3 text-ink transition hover:scale-105"
              aria-label={ui.demo.send}
            >
              <Send size={18} />
            </button>
          </div>

          {speechError && <p className="text-center text-xs text-red-300">{speechError}</p>}

          <button
            type="button"
            onClick={listen}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-clay/40 bg-clay/15 py-4 text-clay-soft transition hover:bg-clay/25"
          >
            {state.listening ? <Waveform active bars={10} /> : <Mic size={18} />}
            {state.listening ? ui.demo.listening : ui.demo.listen}
          </button>
          <p className="text-center text-xs text-cream/40">{ui.demo.intakeHint}</p>
        </motion.div>
      )}
    </div>
  );
}
