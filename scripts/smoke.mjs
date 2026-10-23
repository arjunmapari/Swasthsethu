// End-to-end check of accounts, permissions and the case API.
// Start the app first, with RATE_LIMIT_OFF=1 so the test can sign up many users:
//   RATE_LIMIT_OFF=1 npm run dev
//   ADMIN_EMAIL=you@clinic.org ADMIN_PASSWORD=... npm run smoke
// (create that admin first with: npm run create-admin)
import { randomUUID } from "node:crypto";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@clinic.test";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin-pass-123";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const run = randomUUID().slice(0, 8);
const PW = "Correct-horse-9";

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${extra}`}`);
  if (!ok) failed++;
};

// --- tiny cookie-jar client ---
const jar = () => ({ cookie: "" });
async function call(path, { j, method = "GET", body, form, headers = {} } = {}) {
  const h = { ...headers };
  if (j?.cookie) h.Cookie = j.cookie;
  if (body !== undefined) h["Content-Type"] = "application/json";
  const res = await fetch(BASE + path, { method, redirect: "manual", headers: h, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(";");
    const [k, v] = pair.split("=");
    if (k === "ss_session" && j) j.cookie = v ? pair : "";
  }
  return res;
}
const J = async (res) => res.json().catch(() => ({}));

const walk = (steps) => steps.map(([questionId, optionId, text]) => (optionId ? { questionId, optionId, label: "ignored — server uses its own script text" } : { questionId, label: text }));
const intro = walk([["age", "adult"], ["sex", "male"]]);
const chest = [...intro, ...walk([["complaint", "chest"], ["chest_when", "hours"], ["chest_severity", "severe"], ["chest_breath", "yes"], ["chest_radiate", "arm"], ["allergies", null, "Penicillin"], ["medicines", "none"], ["past", "none"]])];
const fever = [...intro, ...walk([["complaint", "fever"], ["fever_when", "days"], ["fever_severity", "low"], ["fever_chills", "no"], ["fever_other", "rash"], ["allergies", "none"], ["medicines", "none"], ["past", "none"]])];
const sample = (id) => ({ id, name: "lab-report.svg", kind: "lab", extractedTitle: "Lab report", extractedDetail: "Hemoglobin 11.2 g/dL", flag: "Low hemoglobin", sampleUrl: "/samples/lab-report.svg" });
const newCase = (answers, documents = [], requestId = randomUUID()) => ({ requestId, locale: "en", answers, documents });

// ============ patients register + sign in ============
const A = jar(), B = jar();
const emailA = `a-${run}@patients.test`, emailB = `b-${run}@patients.test`;

let r = await call("/api/auth/register", { j: jar(), method: "POST", body: { name: "Asha Patil", email: emailA, password: "short" } });
check("register: weak password -> 400", r.status === 400, r.status);
r = await call("/api/auth/register", { j: jar(), method: "POST", body: { name: "Asha Patil", email: "not-an-email", password: PW } });
check("register: invalid email -> 400", r.status === 400, r.status);
r = await call("/api/auth/register", { j: A, method: "POST", body: { name: "Asha Patil", email: emailA, password: PW } });
let data = await J(r);
const codeA = data.user?.patientCode;
check("register patient A -> 201, gets a PT-XXXX-XXXX patient ID, signed in", r.status === 201 && /^PT-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(codeA ?? "") && data.redirect === "/patient" && !!A.cookie, JSON.stringify(data));
check("register: response never contains the password hash", !JSON.stringify(data).includes("scrypt"));
r = await call("/api/auth/register", { j: jar(), method: "POST", body: { name: "Other", email: emailA.toUpperCase(), password: PW } });
check("register: same email in different case -> 409", r.status === 409, r.status);
r = await call("/api/auth/register", { j: B, method: "POST", body: { name: "Bhaskar Rao", email: emailB, password: PW } });
const codeB = (await J(r)).user?.patientCode;
check("register patient B -> 201 with a different patient ID", r.status === 201 && codeB && codeB !== codeA, r.status);
r = await call("/api/auth/register", { j: jar(), method: "POST", body: { name: "X", email: `x-${run}@patients.test`, password: PW }, headers: { Origin: "https://evil.example" } });
check("register: cross-site request -> 403", r.status === 403, r.status);

r = await call("/api/auth/login", { j: jar(), method: "POST", body: { email: emailA, password: "wrong-password-1" } });
check("login: wrong password -> 401", r.status === 401, r.status);
r = await call("/api/auth/login", { j: jar(), method: "POST", body: { email: `nobody-${run}@patients.test`, password: PW } });
check("login: unknown email -> 401 (same message, no account hints)", r.status === 401 && (await J(r)).error === "Incorrect email or password.", r.status);
const A2 = jar();
r = await call("/api/auth/login", { j: A2, method: "POST", body: { email: emailA.toUpperCase(), password: PW } });
data = await J(r);
check("login: patient signs in (email is case-insensitive) and lands on /patient", r.status === 200 && data.redirect === "/patient" && data.user.patientCode === codeA, JSON.stringify(data));

// ============ signed out ============
for (const [m, p] of [["POST", "/api/cases"], ["GET", "/api/cases"], ["POST", "/api/uploads"], ["GET", "/api/admin/users"]]) {
  r = await call(p, { j: jar(), method: m, body: m === "POST" ? {} : undefined });
  check(`signed out: ${m} ${p} -> 401`, r.status === 401, r.status);
}

// ============ patient A saves a visit ============
const form = new FormData();
form.append("file", new Blob([PNG], { type: "image/png" }), "rx.png");
r = await call("/api/uploads", { j: A, method: "POST", form });
const fileId = (await J(r)).fileId;
check("patient A: upload PNG -> 201 + fileId", r.status === 201 && !!fileId, r.status);
const bad = new FormData();
bad.append("file", new Blob(["<svg onload=alert(1)/>"], { type: "image/png" }), "x.png");
r = await call("/api/uploads", { j: A, method: "POST", form: bad });
check("patient A: fake image (SVG bytes) -> 415", r.status === 415, r.status);

const req1 = randomUUID();
const docs = [sample("d1"), { id: "d2", name: "rx.png", kind: "prescription", extractedTitle: "Photo of a document", extractedDetail: "Attached for the doctor to read — not auto-read.", fileId }];
r = await call("/api/cases", { j: A, method: "POST", body: newCase(chest, docs, req1) });
data = await J(r);
const caseA1 = data.caseId;
check("patient A: save chest-pain intake -> 201 + SS-XXXX-XXXX case ID + their patient ID", r.status === 201 && /^SS-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(caseA1 ?? "") && data.patientCode === codeA, JSON.stringify(data));
r = await call("/api/cases", { j: A, method: "POST", body: newCase(chest, docs, req1) });
check("patient A: retry with the same requestId returns the same case (no duplicate)", r.status === 200 && (await J(r)).caseId === caseA1, r.status);

for (const [name, payload] of [
  ["unknown question", newCase([{ questionId: "nope", optionId: "a", label: "a" }])],
  ["unknown option", newCase([{ questionId: "age", optionId: "nope", label: "a" }])],
  ["bad requestId", { ...newCase(chest), requestId: "123" }],
  ["answers out of order", newCase([chest[0], chest[2], ...chest.slice(3)])],
  ["two complaints mixed", newCase([...chest.slice(0, 4), ...fever.slice(3)])],
  ["incomplete intake", newCase(chest.slice(0, 5))],
  ["unlisted sample url", newCase(chest, [{ ...sample("d9"), sampleUrl: "/etc/passwd" }])],
  ["typed answer over 500 chars", newCase(chest.map((a) => (a.questionId === "allergies" ? { questionId: "allergies", label: "x".repeat(501) } : a)))],
]) {
  r = await call("/api/cases", { j: A, method: "POST", body: payload });
  check(`patient A: reject ${name} -> 400`, r.status === 400, r.status);
}
r = await call("/api/cases", { j: A, method: "POST", body: newCase(chest), headers: { Origin: "https://evil.example" } });
check("patient A: cross-site POST -> 403", r.status === 403, r.status);

// ============ patient B cannot touch A's data ============
r = await call("/api/cases", { j: B, method: "POST", body: newCase(chest, [{ id: "d2", name: "rx.png", kind: "other", extractedTitle: "Photo", extractedDetail: "x", fileId }]) });
check("patient B: cannot attach patient A's uploaded photo -> 400", r.status === 400, r.status);
r = await call("/api/cases", { j: B, method: "POST", body: newCase(fever, [], req1) });
check("patient B: cannot reuse patient A's requestId to read A's case -> 409", r.status === 409, `${r.status} ${JSON.stringify(await J(r))}`);
r = await call(`/api/cases/${caseA1}`, { j: B });
check("patient B: GET A's case -> 404 (looks like it doesn't exist)", r.status === 404, r.status);
r = await call(`/api/uploads/${fileId}`, { j: B });
check("patient B: GET A's uploaded photo -> 404", r.status === 404, r.status);
r = await call("/api/cases", { j: B });
check("patient B: own case list is empty (A's visit is not in it)", r.status === 200 && (await J(r)).cases.length === 0);
r = await call(`/api/cases/${caseA1}`, { j: B, method: "PATCH", body: { status: "completed" } });
check("patient B: cannot change case status -> 403", r.status === 403, r.status);
r = await call("/api/admin/users", { j: B });
check("patient B: admin API -> 403", r.status === 403, r.status);
r = await call(`/patient/cases/${caseA1}`, { j: B });
check("patient B: page for A's case is a 404", r.status === 404, r.status);

// ============ admin creates a doctor ============
const ADM = jar();
r = await call("/api/auth/login", { j: ADM, method: "POST", body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
data = await J(r);
check("admin: signs in and lands on /admin", r.status === 200 && data.user.role === "admin" && data.redirect === "/admin", `${r.status} ${JSON.stringify(data)}`);
const docEmail = `dr-${run}@clinic.test`;
r = await call("/api/admin/users", { j: ADM, method: "POST", body: { name: "Dr. Mehta", email: docEmail, password: PW, role: "doctor" } });
const doctorId = (await J(r)).user?.id;
check("admin: create doctor account -> 201", r.status === 201 && !!doctorId, r.status);
r = await call("/api/admin/users", { j: ADM, method: "POST", body: { name: "Dr. Mehta", email: docEmail, password: PW, role: "doctor" } });
check("admin: duplicate doctor email -> 409", r.status === 409, r.status);
r = await call("/api/admin/users", { j: ADM, method: "POST", body: { name: "Weak", email: `w-${run}@clinic.test`, password: "abc", role: "doctor" } });
check("admin: weak password -> 400", r.status === 400, r.status);
r = await call("/api/admin/users", { j: A, method: "POST", body: { name: "Hacker", email: `h-${run}@x.test`, password: PW, role: "admin" } });
check("patient cannot create an admin -> 403", r.status === 403, r.status);

const DOC = jar();
r = await call("/api/auth/login", { j: DOC, method: "POST", body: { email: docEmail, password: PW } });
check("doctor: signs in and lands on /doctor", r.status === 200 && (await J(r)).redirect === "/doctor", r.status);
r = await call("/api/admin/users", { j: DOC, method: "POST", body: { name: "Sneaky", email: `s-${run}@x.test`, password: PW, role: "admin" } });
check("doctor cannot create accounts -> 403", r.status === 403, r.status);

// ============ doctor reads what patient A saved ============
r = await call(`/api/cases/${caseA1}`, { j: DOC });
let rec = await J(r);
check("doctor: GET case -> 200 with patient name, patient ID and email", r.status === 200 && rec.patientName === "Asha Patil" && rec.patientCode === codeA && rec.patientEmail === emailA, JSON.stringify(rec).slice(0, 200));
check("doctor: 3 chest red flags + urgent", rec.flags?.length === 3 && rec.urgent === true, JSON.stringify(rec.flags));
check("doctor: English prompt + label stored for scripted answers", rec.answers.find((a) => a.questionId === "complaint")?.labelEn === "Chest pain" && rec.answers.every((a) => a.promptEn));
check("doctor: typed answer kept verbatim", rec.answers.find((a) => a.questionId === "allergies").label === "Penicillin");
r = await call(`/api/cases/${caseA1.toLowerCase().replaceAll("-", "")}`, { j: DOC });
check("doctor: case lookup tolerates lower-case / no dashes", r.status === 200, r.status);
r = await call(`/api/cases/..%2F..%2Fpackage.json`, { j: DOC });
check("doctor: path-traversal id -> 404", r.status === 404, r.status);
r = await call(`/api/uploads/${fileId}`, { j: DOC });
const bytes = Buffer.from(await r.arrayBuffer());
check("doctor: GET patient's photo -> original PNG bytes", r.status === 200 && r.headers.get("content-type") === "image/png" && bytes.equals(PNG), r.status);
r = await call("/api/cases", { j: DOC });
check("doctor: queue lists the case", (await J(r)).cases.some((c) => c.id === caseA1));

// ============ patient A reads their own record ============
r = await call(`/api/cases/${caseA1}`, { j: A });
check("patient A: can read their own case", r.status === 200 && (await J(r)).id === caseA1, r.status);
r = await call(`/api/uploads/${fileId}`, { j: A });
check("patient A: can open their own photo", r.status === 200, r.status);

// ============ status workflow (doctor) ============
const patch = (s, extra = {}) => call(`/api/cases/${caseA1}`, { j: DOC, method: "PATCH", body: { status: s }, ...extra });
r = await patch("in_consultation");
check("doctor: status -> in_consultation", r.status === 200 && (await J(r)).status === "in_consultation", r.status);
r = await patch("banana");
check("doctor: invalid status -> 400", r.status === 400, r.status);
r = await patch("completed", { headers: { Origin: "https://evil.example" } });
check("doctor: cross-site PATCH -> 403", r.status === 403, r.status);

// ============ a later visit: history accumulates under one patient ID ============
r = await call("/api/cases", { j: A, method: "POST", body: newCase(fever, []) });
const caseA2 = (await J(r)).caseId;
check("patient A: second visit saved", r.status === 201 && !!caseA2 && caseA2 !== caseA1, r.status);
const comeBack = jar();
r = await call("/api/auth/login", { j: comeBack, method: "POST", body: { email: emailA, password: PW } });
r = await call("/api/cases", { j: comeBack });
const hist = (await J(r)).cases;
check("patient A: signing in again later shows ALL earlier visits, newest first", hist.length === 2 && hist[0].id === caseA2 && hist[1].id === caseA1, JSON.stringify(hist.map((c) => c.id)));
check("patient A: the earlier visit's status is visible to them (in_consultation)", hist[1].status === "in_consultation");
r = await call(`/patient`, { j: comeBack });
let html = await r.text();
check("patient page shows patient ID, both case IDs", r.status === 200 && html.includes(codeA) && html.includes(caseA1) && html.includes(caseA2));
r = await call(`/patient/cases/${caseA1}`, { j: comeBack });
html = await r.text();
check("patient page for an old visit shows the full record (answers + red flags)", r.status === 200 && html.includes("Penicillin") && html.includes("Chest pain"), r.status);

// ============ doctor sees the same patient's whole history ============
r = await call(`/doctor/patient/${codeA}`, { j: DOC });
html = await r.text();
check("doctor: patient-history page lists both visits and the patient's details", r.status === 200 && html.includes(caseA1) && html.includes(caseA2) && html.includes("Asha Patil") && html.includes(emailA));
r = await call(`/doctor/${caseA2}`, { j: DOC });
html = await r.text();
check("doctor: a case page shows 'Earlier visits' with the previous case", r.status === 200 && html.includes("Earlier visits") && html.includes(caseA1));
r = await call(`/doctor`, { j: DOC });
html = await r.text();
check("doctor home: queue shows patient names and IDs; urgent first", r.status === 200 && html.includes("Asha Patil") && html.includes(codeA) && html.includes("Urgent"));
r = await call(`/doctor/patient/PT-ABCD-EFGH`, { j: DOC });
check("doctor: unknown patient ID shows 'Patient not found'", (await r.text()).includes("Patient not found"));

// ============ role-based page access ============
r = await call("/doctor", { j: A });
check("patient visiting /doctor is sent to /patient", r.status === 307 && r.headers.get("location")?.includes("/patient"), `${r.status} ${r.headers.get("location")}`);
r = await call(`/doctor/${caseA1}`, { j: A });
check("patient visiting a doctor case URL is sent away (no data)", r.status === 307, r.status);
r = await call("/demo", { j: DOC });
check("doctor visiting the kiosk is sent to their console", r.status === 307 && r.headers.get("location")?.includes("/doctor"), `${r.status} ${r.headers.get("location")}`);
r = await call("/admin", { j: DOC });
check("doctor visiting /admin is sent to /doctor", r.status === 307 && r.headers.get("location")?.endsWith("/doctor"), `${r.status} ${r.headers.get("location")}`);
r = await call("/admin", { j: ADM });
check("admin page loads for the admin and lists patients", r.status === 200 && (await r.text()).includes(codeA));
r = await call("/demo", { j: A });
check("signed-in patient can open the kiosk", r.status === 200, r.status);
r = await call("/login?next=/demo", { j: A });
check("signed-in patient visiting /login is forwarded to ?next", r.status === 307 && r.headers.get("location")?.endsWith("/demo"), `${r.status} ${r.headers.get("location")}`);
r = await call("/login?next=//evil.example", { j: A });
check("open-redirect attempt via ?next is ignored", r.status === 307 && !r.headers.get("location")?.includes("evil"), r.headers.get("location"));

// ============ typed emergency wording + pregnancy ============
const typed = [...intro, ...walk([["complaint", null, "mere seene mein dard"], ["chest_when", "days"], ["chest_severity", null, "I can't breathe properly"], ["chest_breath", "no"], ["chest_radiate", "no"], ["allergies", "none"], ["medicines", "none"], ["past", "none"]])];
r = await call("/api/cases", { j: B, method: "POST", body: newCase(typed) });
const typedId = (await J(r)).caseId;
rec = await J(await call(`/api/cases/${typedId}`, { j: DOC }));
check("typed 'can't breathe' is flagged urgent even though no option matched", rec.urgent === true && rec.flags.length === 1 && /emergency/i.test(rec.flags[0]), JSON.stringify(rec.flags));
const preg = walk([["age", "adult"], ["sex", "female"], ["pregnancy", "maybe"], ["complaint", "stomach"], ["stomach_when", "days"], ["stomach_severity", "mod"], ["stomach_eat", "worse"], ["stomach_vomit", "none"], ["allergies", "none"], ["medicines", "none"], ["past", "none"]]);
r = await call("/api/cases", { j: B, method: "POST", body: newCase(preg) });
rec = await J(await call(`/api/cases/${(await J(r)).caseId}`, { j: DOC }));
check("possible pregnancy + stomach pain gets the pregnancy flag and is urgent", rec.urgent === true && rec.flags.some((f) => /pregnan/i.test(f)), JSON.stringify(rec.flags));

// ============ account control ============
r = await call(`/api/admin/users/${doctorId}`, { j: ADM, method: "PATCH", body: { active: false } });
check("admin: disable the doctor", r.status === 200 && (await J(r)).user.active === false, r.status);
r = await call(`/api/cases/${caseA1}`, { j: DOC });
check("disabled doctor's existing session stops working immediately -> 401", r.status === 401, r.status);
r = await call("/api/auth/login", { j: jar(), method: "POST", body: { email: docEmail, password: PW } });
check("disabled doctor cannot sign in again -> 401", r.status === 401, r.status);
await call(`/api/admin/users/${doctorId}`, { j: ADM, method: "PATCH", body: { active: true } });
const DOC2 = jar();
r = await call("/api/auth/login", { j: DOC2, method: "POST", body: { email: docEmail, password: PW } });
check("admin: re-enabled doctor can sign in", r.status === 200, r.status);
r = await call(`/api/admin/users/${doctorId}`, { j: ADM, method: "PATCH", body: { password: "New-password-77" } });
check("admin: reset the doctor's password", r.status === 200, r.status);
r = await call(`/api/cases/${caseA1}`, { j: DOC2 });
check("password reset signs the doctor out everywhere -> 401", r.status === 401, r.status);
r = await call("/api/auth/login", { j: jar(), method: "POST", body: { email: docEmail, password: PW } });
check("old password no longer works", r.status === 401, r.status);
r = await call("/api/auth/login", { j: jar(), method: "POST", body: { email: docEmail, password: "New-password-77" } });
check("new password works", r.status === 200, r.status);
const me = (await J(await call("/api/auth/login", { j: jar(), method: "POST", body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } }))).user;
r = await call(`/api/admin/users/${me.id}`, { j: ADM, method: "PATCH", body: { active: false } });
check("admin cannot disable their own account -> 400", r.status === 400, r.status);

// ============ sign out ============
r = await call("/api/auth/logout", { j: A, method: "POST" });
r = await call("/api/cases", { j: A });
check("sign out clears the session -> 401 afterwards", r.status === 401, r.status);

// ============ brute-force lock ============
const victim = `lock-${run}@patients.test`;
await call("/api/auth/register", { j: jar(), method: "POST", body: { name: "Lock Test", email: victim, password: PW } });
const codes = [];
for (let i = 0; i < 10; i++) codes.push((await call("/api/auth/login", { j: jar(), method: "POST", body: { email: victim, password: `wrong-guess-${i}` } })).status);
check("10 wrong passwords in a row -> locked (429) after 8", codes.slice(0, 8).every((c) => c === 401) && codes.slice(8).every((c) => c === 429), codes.join(","));
r = await call("/api/auth/login", { j: jar(), method: "POST", body: { email: victim, password: PW } });
check("account stays locked even for the correct password", r.status === 429, r.status);

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
