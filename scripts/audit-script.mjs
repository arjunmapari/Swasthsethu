// Checks the question script: every route resolves, no loops, nothing unreachable, and English/Hindi/Marathi stay in step.
// Needs Node 22.18+ (runs the .ts data files directly):  npm run audit
const load = async (l) => (await import(new URL(`../src/data/questions.${l}.ts`, import.meta.url)))[`questions${l[0].toUpperCase()}${l[1]}`];
const files = { en: await load("en"), hi: await load("hi"), mr: await load("mr") };
let problems = 0;
const bad = (m) => { problems++; console.log("PROBLEM:", m); };

for (const [loc, f] of Object.entries(files)) {
  const ids = new Set(f.questions.map(q => q.id));
  if (ids.size !== f.questions.length) bad(`${loc}: duplicate question ids`);
  if (!ids.has(f.startId)) bad(`${loc}: startId missing`);
  for (const q of f.questions) {
    const oids = q.options.map(o => o.id);
    if (new Set(oids).size !== oids.length) bad(`${loc}/${q.id}: duplicate option ids`);
    for (const o of q.options) if (o.nextId !== "END" && !ids.has(o.nextId)) bad(`${loc}/${q.id}/${o.id}: nextId ${o.nextId} does not exist`);
    if (q.freeTextNextId && q.freeTextNextId !== "END" && !ids.has(q.freeTextNextId)) bad(`${loc}/${q.id}: freeTextNextId broken`);
    if (q.allowFreeText && !q.freeTextNextId) bad(`${loc}/${q.id}: allowFreeText without freeTextNextId`);
    if (!q.prompt?.trim() || q.options.some(o => !o.label?.trim())) bad(`${loc}/${q.id}: empty text`);
  }
  // reachability
  const seen = new Set(); const stack = [f.startId];
  while (stack.length) { const id = stack.pop(); if (seen.has(id) || id === "END") continue; seen.add(id);
    const q = f.questions.find(x => x.id === id); q.options.forEach(o => stack.push(o.nextId)); if (q.freeTextNextId) stack.push(q.freeTextNextId); }
  for (const q of f.questions) if (!seen.has(q.id)) bad(`${loc}: ${q.id} is unreachable`);
  // cycles
  const visiting = new Set(), done = new Set();
  const dfs = (id) => { if (id === "END" || done.has(id)) return; if (visiting.has(id)) { bad(`${loc}: cycle at ${id}`); return; }
    visiting.add(id); const q = f.questions.find(x => x.id === id); [...q.options.map(o=>o.nextId), q.freeTextNextId].filter(Boolean).forEach(dfs); visiting.delete(id); done.add(id); };
  dfs(f.startId);
}
// cross-language parity
const en = files.en;
for (const loc of ["hi", "mr"]) {
  const f = files[loc];
  if (f.questions.length !== en.questions.length) bad(`${loc}: ${f.questions.length} questions vs en ${en.questions.length}`);
  for (const q of en.questions) {
    const t = f.questions.find(x => x.id === q.id);
    if (!t) { bad(`${loc}: missing question ${q.id}`); continue; }
    if (t.phase !== q.phase) bad(`${loc}/${q.id}: phase differs`);
    if (!!t.allowFreeText !== !!q.allowFreeText) bad(`${loc}/${q.id}: allowFreeText differs`);
    if (t.freeTextNextId !== q.freeTextNextId) bad(`${loc}/${q.id}: freeTextNextId differs`);
    const a = q.options.map(o => `${o.id}>${o.nextId}`).join(), b = t.options.map(o => `${o.id}>${o.nextId}`).join();
    if (a !== b) bad(`${loc}/${q.id}: options/routing differ\n   en: ${a}\n   ${loc}: ${b}`);
  }
}
// count every path per complaint without keeping them in memory
const f = en; const q = (id) => f.questions.find(x => x.id === id);
const stats = {}; let total = 0;
const walk = (id, depth, complaint) => {
  if (id === "END") { total++; const s = (stats[complaint ?? "?"] ??= { n: 0, min: Infinity, max: 0 }); s.n++; s.min = Math.min(s.min, depth); s.max = Math.max(s.max, depth); return; }
  for (const o of q(id).options) walk(o.nextId, depth + 1, id === "complaint" ? o.id : complaint);
};
walk(f.startId, 0, null);
console.log("total scripted paths:", total);
for (const [c, s] of Object.entries(stats)) console.log(`  ${c}: ${s.n} paths, ${s.min}-${s.max} questions each`);
console.log(problems === 0 ? "STRUCTURE OK" : `${problems} structural problem(s)`);
