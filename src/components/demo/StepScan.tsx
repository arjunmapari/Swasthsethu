"use client";

import { motion } from "framer-motion";
import { FileUp } from "lucide-react";
import { useState } from "react";
import { Waveform } from "@/components/Waveform";
import { HttpError, uploadPhoto } from "@/lib/api";
import { UnsupportedImageError, prepareImage } from "@/lib/image";
import { mockExtract } from "@/lib/summary";
import { uuid } from "@/lib/uuid";
import type { Locale, ScannedDoc } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";

export function StepScan({
  locale,
  documents,
  onAdd,
  onSkip,
  onContinue,
}: {
  locale: Locale;
  documents: ScannedDoc[];
  onAdd: (doc: ScannedDoc) => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  const { ui } = useLanguage();
  const [asked, setAsked] = useState(documents.length > 0);
  const [busy, setBusy] = useState<"idle" | "scan" | "ocr">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // `store` runs alongside the scanning animation, so the upload costs no extra waiting.
  const runScan = async (
    name: string,
    previewUrl: string,
    store: () => Promise<Pick<ScannedDoc, "fileId" | "sampleUrl">>,
    extract: Pick<ScannedDoc, "kind" | "extractedTitle" | "extractedDetail" | "flag">,
  ) => {
    setError(null);
    setPreview(previewUrl);
    setBusy("scan");
    try {
      const [stored] = await Promise.all([store(), wait(1100)]);
      setBusy("ocr");
      await wait(900);
      onAdd({ id: uuid(), name, previewUrl, ...stored, ...extract });
    } catch (err) {
      const notAnImage = err instanceof UnsupportedImageError || (err instanceof HttpError && err.status === 415);
      setError(notAnImage ? ui.demo.uploadUnsupported : ui.demo.uploadFailed);
    } finally {
      setBusy("idle");
      setPreview(null);
    }
  };

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || busy !== "idle") return;
    // There is no real OCR yet, so never invent medicine names or lab values for a real photo:
    // say plainly that it is attached for the doctor to read.
    void runScan(
      file.name,
      URL.createObjectURL(file),
      async () => ({ fileId: await uploadPhoto(await prepareImage(file), file.name) }),
      { kind: "other", extractedTitle: ui.demo.uploadedDocTitle, extractedDetail: ui.demo.uploadedDocDetail },
    );
  };

  // The bundled samples are demo content, so their demo "extraction" matches what is pictured.
  const addSample = (name: string, url: string, sample: 0 | 1) =>
    void runScan(name, url, async () => ({ sampleUrl: url }), mockExtract(sample, locale));

  if (!asked) {
    return (
      <div className="flex min-h-[70vh] flex-col">
        <h1 className="font-display text-3xl text-cream">{ui.demo.scanTitle}</h1>
        <p className="mt-3 text-lg text-cream/70">{ui.demo.scanBody}</p>
        <div className="mt-auto space-y-3 pt-12">
          <button
            type="button"
            onClick={() => setAsked(true)}
            className="w-full rounded-full bg-clay py-4 text-lg font-medium text-cream transition hover:scale-[1.02] active:scale-[0.98]"
          >
            {ui.demo.scanYes}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="w-full rounded-full border border-white/15 py-4 text-lg text-cream/80 hover:bg-white/8"
          >
            {ui.demo.scanSkip}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <h1 className="font-display text-2xl text-cream">{ui.demo.scanZoneTitle}</h1>
      <p className="mt-2 text-sm text-cream/55">{ui.demo.scanZoneHint}</p>

      <label
        className="relative mt-6 flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-clay/50 bg-white/5"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
      >
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFiles(e.target.files)} />
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
            <ScanLine />
            <p className="relative z-10 rounded-full bg-ink/70 px-4 py-2 text-sm">
              {busy === "scan" ? ui.demo.scanning : ui.demo.extracting}
            </p>
          </>
        ) : (
          <>
            <FileUp className="mb-2 text-clay-soft" />
            <span className="text-cream/70">PNG, JPG</span>
          </>
        )}
      </label>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => addSample("prescription.svg", "/samples/prescription.svg", 0)}
          className="flex-1 rounded-2xl bg-white/8 px-3 py-3 text-sm text-cream hover:bg-white/12"
        >
          {ui.demo.scanSampleRx}
        </button>
        <button
          type="button"
          onClick={() => addSample("lab-report.svg", "/samples/lab-report.svg", 1)}
          className="flex-1 rounded-2xl bg-white/8 px-3 py-3 text-sm text-cream hover:bg-white/12"
        >
          {ui.demo.scanSampleLab}
        </button>
      </div>

      {documents.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-cream/40">{ui.demo.scannedList}</p>
          <ul className="mt-2 space-y-2">
            {documents.map((d) => (
              <li key={d.id} className="rounded-2xl bg-cream px-4 py-3 text-ink">
                <p className="font-medium">{d.extractedTitle}</p>
                <p className="text-sm text-ink/70">{d.extractedDetail}</p>
                {d.flag && <p className="mt-1 text-xs text-clay">{d.flag}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-clay/15 px-4 py-3 text-sm text-clay-soft">
          {error}
        </p>
      )}

      {busy !== "idle" && (
        <div className="mt-4 flex justify-center">
          <Waveform active />
        </div>
      )}

      <button
        type="button"
        disabled={busy !== "idle" || documents.length === 0}
        onClick={onContinue}
        className="mt-auto w-full rounded-full bg-clay py-4 font-medium text-cream transition enabled:hover:scale-[1.02] disabled:opacity-40"
      >
        {ui.demo.continue}
      </button>
    </div>
  );
}

function ScanLine() {
  return (
    <motion.span
      className="pointer-events-none absolute inset-x-0 z-[1] h-1 bg-clay shadow-[0_0_18px_#c45c3e]"
      animate={{ top: ["0%", "96%", "0%"] }}
      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
