export type Locale = "en" | "hi" | "mr";

export type WizardStep =
  | "language"
  | "consent"
  | "declined"
  | "intake"
  | "scan"
  | "generate"
  | "doctor";

export type QuestionPhase = "opening" | "followup" | "closing";

export type NextId = string | "END";

export type AnswerOption = {
  id: string;
  label: string;
  nextId: NextId;
};

export type Question = {
  id: string;
  phase: QuestionPhase;
  prompt: string;
  hint?: string;
  options: AnswerOption[];
  allowFreeText?: boolean;
  freeTextPlaceholder?: string;
  freeTextNextId?: NextId;
};

export type QuestionsFile = {
  startId: string;
  questions: Question[];
};

export type LandingCopy = {
  brand: string;
  brandMark: string;
  navDemo: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSub: string;
  heroCta: string;
  heroSecondary: string;
  previewQuestion: string;
  previewReply: string;
  previewListening: string;
  problemKicker: string;
  problemTitle: string;
  problemBeforeTitle: string;
  problemBefore: string;
  problemAfterTitle: string;
  problemAfter: string;
  storyKicker: string;
  storyTitle: string;
  storySteps: { title: string; body: string }[];
  impactKicker: string;
  impactTitle: string;
  stats: { value: string; label: string }[];
  roadmapKicker: string;
  roadmapTitle: string;
  roadmapBody: string;
  roadmapNow: string;
  roadmapNext: string;
  teamKicker: string;
  teamTitle: string;
  teamBody: string;
  footerNote: string;
};

export type DemoCopy = {
  stepOf: string;
  back: string;
  languageTitle: string;
  languageSub: string;
  languageHint: string;
  consentTitle: string;
  consentBody: string[];
  consentAgree: string;
  consentDecline: string;
  declinedTitle: string;
  declinedBody: string;
  declinedWait: string;
  restart: string;
  intakeHint: string;
  typePlaceholder: string;
  send: string;
  listen: string;
  listening: string;
  skipType: string;
  scanTitle: string;
  scanBody: string;
  scanYes: string;
  scanSkip: string;
  scanZoneTitle: string;
  scanZoneHint: string;
  scanSampleRx: string;
  scanSampleLab: string;
  scanning: string;
  extracting: string;
  scannedList: string;
  addAnother: string;
  continue: string;
  generateTitle: string;
  generateSub: string;
  generateSections: string[];
  doctorEyebrow: string;
  doctorTitle: string;
  doctorPatient: string;
  doctorConfirm: string;
  doctorRestart: string;
  chiefComplaint: string;
  history: string;
  flags: string;
  documents: string;
  allergies: string;
  medications: string;
  pastHistory: string;
  noDocuments: string;
  flagLabel: string;
  urgentNotice: string;
  caseIdLabel: string;
  caseIdHint: string;
  caseIdCopy: string;
  caseIdCopied: string;
  generateSaving: string;
  saveFailedTitle: string;
  saveFailedBody: string;
  saveRetry: string;
  saveContinue: string;
  notSavedNote: string;
  uploadFailed: string;
  uploadUnsupported: string;
  uploadedDocTitle: string;
  uploadedDocDetail: string;
};

export type UiFile = {
  landing: LandingCopy;
  demo: DemoCopy;
  locales: Record<Locale, string>;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "patient";
  text: string;
  listening?: boolean;
};

export type ScannedDoc = {
  id: string;
  name: string;
  kind: "prescription" | "lab" | "other";
  previewUrl: string;
  extractedTitle: string;
  extractedDetail: string;
  flag?: string;
  /** Set when the patient's own photo was uploaded to the server. */
  fileId?: string;
  /** Set when one of the bundled sample documents was used. */
  sampleUrl?: string;
};

export type DemoAnswer = {
  questionId: string;
  optionId?: string;
  label: string;
};

export type CaseStatus = "new" | "in_consultation" | "completed";

export type StoredAnswer = {
  questionId: string;
  optionId?: string;
  /** What the patient chose or said, in their own language. */
  label: string;
  /** English rendering for the doctor. Only known for scripted options. */
  labelEn?: string;
  /** Question text in the patient's language and in English (script snapshot). */
  prompt: string;
  promptEn: string;
  phase: QuestionPhase;
};

export type StoredDocument = {
  id: string;
  name: string;
  kind: ScannedDoc["kind"];
  extractedTitle: string;
  extractedDetail: string;
  flag?: string;
  /** Bundled sample image, e.g. /samples/lab-report.svg */
  sampleUrl?: string;
  /** Uploaded photo, served to signed-in doctors from /api/uploads/:fileId */
  fileId?: string;
};

export type Role = "patient" | "doctor" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** Only patients have one, e.g. PT-7K4M-9QXD. */
  patientCode: string | null;
};

export type CaseRecord = {
  id: string;
  patientId: string;
  patientCode: string;
  patientName: string;
  patientEmail: string;
  createdAt: string;
  updatedAt: string;
  locale: Locale;
  status: CaseStatus;
  chiefComplaint: string;
  chiefComplaintEn?: string;
  answers: StoredAnswer[];
  documents: StoredDocument[];
  /** Doctor-facing red flags, English. */
  flags: string[];
  /** True when a flag means the patient should not wait in the normal queue. */
  urgent?: boolean;
};

export type CaseListItem = Pick<
  CaseRecord,
  "id" | "createdAt" | "locale" | "status" | "chiefComplaint" | "chiefComplaintEn"
> & { patientCode: string; patientName: string; flagCount: number; documentCount: number; urgent: boolean };

/** Body the kiosk sends to POST /api/cases. */
export type CreateCasePayload = {
  requestId: string;
  locale: Locale;
  answers: DemoAnswer[];
  documents: {
    id: string;
    name: string;
    kind: ScannedDoc["kind"];
    extractedTitle: string;
    extractedDetail: string;
    flag?: string;
    sampleUrl?: string;
    fileId?: string;
  }[];
};

/** What validation produces and the database layer stores. */
export type NewCase = Omit<
  CaseRecord,
  "id" | "createdAt" | "updatedAt" | "status" | "patientId" | "patientCode" | "patientName" | "patientEmail"
>;
