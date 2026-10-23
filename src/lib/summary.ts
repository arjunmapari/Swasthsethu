import type { DemoAnswer, Locale, ScannedDoc } from "@/lib/types";

export type FlagKey =
  | "chest_severe"
  | "chest_breath"
  | "chest_radiate"
  | "fever_high"
  | "fever_chills"
  | "fever_rash"
  | "head_worst"
  | "head_neuro"
  | "cough_blood"
  | "cough_long"
  | "stomach_severe"
  | "pregnancy_pain"
  | "free_text_alert";

const FLAG_COPY: Record<Locale, Record<FlagKey, string>> = {
  en: {
    chest_severe: "Chest pain rated severe (7–10).",
    chest_breath: "Shortness of breath with chest pain.",
    chest_radiate: "Pain radiating to arm or jaw — review urgently.",
    fever_high: "Measured high fever (≥102°F / 39°C).",
    fever_chills: "Shaking chills with fever.",
    fever_rash: "Fever with rash or unusual spots.",
    head_worst: "Patient describes worst headache ever.",
    head_neuro: "Headache with blurred or double vision.",
    cough_blood: "Possible hemoptysis reported.",
    cough_long: "Cough longer than two weeks.",
    stomach_severe: "Severe abdominal pain — patient doubled over.",
    pregnancy_pain: "Possible pregnancy with moderate/severe abdominal pain or headache — review urgently.",
    free_text_alert: "Typed or spoken answer mentions a possible emergency — read it first.",
  },
  hi: {
    chest_severe: "छाती का दर्द तेज़ (7–10) बताया गया।",
    chest_breath: "छाती दर्द के साथ साँस फूलना।",
    chest_radiate: "दर्द बाँह/जबड़े तक — जल्दी देखें।",
    fever_high: "मापा गया तेज़ बुखार (≥102°F / 39°C)।",
    fever_chills: "बुखार के साथ काँपना।",
    fever_rash: "बुखार के साथ दाने या असामान्य धब्बे।",
    head_worst: "मरीज़ ने अब तक का सबसे तेज़ सिरदर्द बताया।",
    head_neuro: "सिरदर्द के साथ धुंधला या दोहरा दिखना।",
    cough_blood: "बलग़म में ख़ून की संभावना।",
    cough_long: "खाँसी दो हफ़्ते से ज़्यादा।",
    stomach_severe: "बहुत तेज़ पेट दर्द — झुकना पड़ा।",
    pregnancy_pain: "संभावित गर्भावस्था के साथ मध्यम/तेज़ पेट दर्द या सिरदर्द — जल्दी देखें।",
    free_text_alert: "लिखे/बोले गए जवाब में संभावित आपात स्थिति का ज़िक्र — पहले पढ़ें।",
  },
  mr: {
    chest_severe: "छातीचे दुखणे तीव्र (७–१०) सांगितले.",
    chest_breath: "छातीदुखीसोबत श्वास लागणे.",
    chest_radiate: "दुखणे हात/जबड्याकडे — तातडीने पहा.",
    fever_high: "मोजलेला जास्त ताप (≥१०२°F / ३९°C).",
    fever_chills: "तापासोबत कंप.",
    fever_rash: "तापासोबत पुरळ किंवा असामान्य डाग.",
    head_worst: "रुग्णाने आतापर्यंतची सर्वात तीव्र डोकेदुखी सांगितली.",
    head_neuro: "डोकेदुखीसोबत अंधुक किंवा दुहेरी दिसणे.",
    cough_blood: "थुंकीत रक्ताची शक्यता.",
    cough_long: "खोकला दोन आठवड्यांपेक्षा जास्त.",
    stomach_severe: "तीव्र पोटदुखी — वाकावे लागले.",
    pregnancy_pain: "संभाव्य गर्भधारणेसह मध्यम/तीव्र पोटदुखी किंवा डोकेदुखी — तातडीने पहा.",
    free_text_alert: "लिहिलेल्या/बोललेल्या उत्तरात संभाव्य आणीबाणीचा उल्लेख — आधी वाचा.",
  },
};

/** Flags where the patient should tell the front desk now rather than wait in the queue. */
const URGENT: ReadonlySet<FlagKey> = new Set([
  "chest_severe",
  "chest_breath",
  "chest_radiate",
  "head_worst",
  "head_neuro",
  "cough_blood",
  "stomach_severe",
  "pregnancy_pain",
  "free_text_alert",
]);

// Typed or spoken answers never match an option, so none of the option-based rules below
// can see them. This is a deliberately small safety net for emergency wording in English,
// Hindi and Marathi — a missed flag is worse than an extra one. It is not a diagnosis.
const EMERGENCY_WORDS = new RegExp(
  [
    "can'?t breathe|cannot breathe|short(ness)? of breath|breathless|difficulty breathing|chest pain|chest tight",
    "unconscious|fainted|passed out|seizure|\\bfits?\\b|\\bparaly|\\bstroke|vomiting blood|coughing blood|heavy bleeding|suicid",
    "साँस नहीं|सांस नहीं|साँस फूल|सांस फूल|सांस लेने में|छाती में दर्द|सीने में दर्द|बेहोश|दौरा|लकवा|ख़ून की उल्टी|खून की उल्टी|खून आ|आत्महत्या",
    "श्वास घेता येत नाही|श्वास लागत|धाप लागत|छातीत दुखत|छातीत दुखणे|बेशुद्ध|फिट आली|अर्धांगवायू|रक्ताची उलटी|रक्तस्त्राव|आत्महत्या",
  ].join("|"),
  "i",
);

export function deriveFlagKeys(answers: DemoAnswer[]): FlagKey[] {
  const o = (id: string) => answers.find((a) => a.questionId === id)?.optionId;
  const keys: FlagKey[] = [];

  if (o("chest_severity") === "severe") keys.push("chest_severe");
  if (o("chest_breath") === "yes") keys.push("chest_breath");
  if (o("chest_radiate") === "arm") keys.push("chest_radiate");
  if (o("fever_severity") === "measured") keys.push("fever_high");
  if (o("fever_chills") === "chills") keys.push("fever_chills");
  if (o("fever_other") === "rash") keys.push("fever_rash");
  if (o("head_severity") === "severe") keys.push("head_worst");
  if (o("head_nausea") === "vision" || o("head_nausea") === "both") keys.push("head_neuro");
  const pregnant = o("pregnancy") === "yes" || o("pregnancy") === "maybe";
  const painful = ["mod", "severe"];
  if (pregnant && (painful.includes(o("stomach_severity") ?? "") || painful.includes(o("head_severity") ?? ""))) keys.push("pregnancy_pain");
  // "Not sure" about blood is treated like a yes — better to ask than to miss it.
  if (o("cough_blood") === "yes" || o("cough_blood") === "unsure") keys.push("cough_blood");
  if (o("cough_when") === "longer") keys.push("cough_long");
  if (o("stomach_severity") === "severe") keys.push("stomach_severe");

  if (answers.some((a) => !a.optionId && EMERGENCY_WORDS.test(a.label))) keys.push("free_text_alert");

  return keys;
}

export function deriveFlags(answers: DemoAnswer[], locale: Locale): string[] {
  return deriveFlagKeys(answers).map((k) => FLAG_COPY[locale][k]);
}

export function isUrgent(answers: DemoAnswer[]): boolean {
  return deriveFlagKeys(answers).some((k) => URGENT.has(k));
}

export function mockExtract(index: number, locale: Locale): Pick<
  ScannedDoc,
  "kind" | "extractedTitle" | "extractedDetail" | "flag"
> {
  const packs = {
    en: [
      {
        kind: "prescription" as const,
        extractedTitle: "Prescription",
        extractedDetail: "Amoxicillin 500 mg · twice daily · 5 days",
      },
      {
        kind: "lab" as const,
        extractedTitle: "Lab report",
        extractedDetail: "Hemoglobin 11.2 g/dL",
        flag: "Low hemoglobin",
      },
      {
        kind: "prescription" as const,
        extractedTitle: "Prescription",
        extractedDetail: "Metformin 500 mg · after meals",
      },
      {
        kind: "other" as const,
        extractedTitle: "Discharge note",
        extractedDetail: "Follow-up for viral fever · 2025",
      },
    ],
    hi: [
      {
        kind: "prescription" as const,
        extractedTitle: "पर्ची",
        extractedDetail: "Amoxicillin 500 mg · दिन में दो बार · 5 दिन",
      },
      {
        kind: "lab" as const,
        extractedTitle: "लैब रिपोर्ट",
        extractedDetail: "हीमोग्लोबिन 11.2 g/dL",
        flag: "हीमोग्लोबिन कम",
      },
      {
        kind: "prescription" as const,
        extractedTitle: "पर्ची",
        extractedDetail: "Metformin 500 mg · खाने के बाद",
      },
      {
        kind: "other" as const,
        extractedTitle: "डिस्चार्ज नोट",
        extractedDetail: "वायरल बुखार का फ़ॉलो-अप · 2025",
      },
    ],
    mr: [
      {
        kind: "prescription" as const,
        extractedTitle: "पर्ची",
        extractedDetail: "Amoxicillin 500 mg · दिवसातून दोनदा · ५ दिवस",
      },
      {
        kind: "lab" as const,
        extractedTitle: "लॅब रिपोर्ट",
        extractedDetail: "हिमोग्लोबिन 11.2 g/dL",
        flag: "हिमोग्लोबिन कमी",
      },
      {
        kind: "prescription" as const,
        extractedTitle: "पर्ची",
        extractedDetail: "Metformin 500 mg · जेवणानंतर",
      },
      {
        kind: "other" as const,
        extractedTitle: "डिस्चार्ज नोट",
        extractedDetail: "वायरल तापाचे फॉलो-अप · २०२५",
      },
    ],
  };

  return packs[locale][index % packs[locale].length];
}
