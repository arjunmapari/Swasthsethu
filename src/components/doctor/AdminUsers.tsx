"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/server/users";

async function call(url: string, method: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) return null;
    return (await res.json().catch(() => null))?.error ?? "Something went wrong.";
  } catch {
    return "Couldn't reach the server.";
  }
}

export function AdminUsers({ users, meId }: { users: PublicUser[]; meId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "doctor" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const err = await call("/api/admin/users", "POST", form);
    setBusy(false);
    if (err) return setMsg({ ok: false, text: err });
    setMsg({ ok: true, text: `Created ${form.role} account for ${form.email}.` });
    setForm({ name: "", email: "", password: "", role: "doctor" });
    router.refresh();
  };

  const toggle = async (u: PublicUser) => {
    const err = await call(`/api/admin/users/${u.id}`, "PATCH", { active: !u.active });
    setMsg(err ? { ok: false, text: err } : null);
    router.refresh();
  };

  const reset = async (u: PublicUser) => {
    const password = window.prompt(`New password for ${u.email} (min 8 characters). They will be signed out everywhere.`);
    if (!password) return;
    const err = await call(`/api/admin/users/${u.id}`, "PATCH", { password });
    setMsg(err ? { ok: false, text: err } : { ok: true, text: `Password changed for ${u.email}.` });
  };

  const input = "mt-1 w-full rounded-xl border border-ink/20 bg-white px-3 py-2.5 outline-none focus:border-clay";
  const staff = users.filter((u) => u.role !== "patient");
  const patients = users.filter((u) => u.role === "patient");

  const Row = ({ u }: { u: PublicUser }) => (
    <li className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3 shadow-sm ${u.active ? "" : "opacity-60"}`}>
      <div className="min-w-0">
        <p className="truncate font-medium">{u.name} <span className="text-xs font-normal uppercase tracking-wide text-ink/45">{u.role}{u.active ? "" : " · disabled"}</span></p>
        <p className="truncate text-sm text-ink/55">
          {u.email}
          {u.patientCode && <> · <Link href={`/doctor/patient/${u.patientCode}`} className="font-mono text-clay hover:underline">{u.patientCode}</Link></>}
        </p>
      </div>
      <div className="flex gap-2 text-sm">
        <button type="button" onClick={() => reset(u)} className="rounded-full border border-ink/20 px-3 py-1.5 hover:bg-ink/5">Reset password</button>
        {u.id !== meId && (
          <button type="button" onClick={() => toggle(u)} className="rounded-full border border-ink/20 px-3 py-1.5 hover:bg-ink/5">{u.active ? "Disable" : "Enable"}</button>
        )}
      </div>
    </li>
  );

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="rounded-[1.4rem] bg-cream p-5 shadow-xl">
        <h2 className="font-display text-xl">Add a doctor or admin</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} /></label>
          <label className="text-sm font-medium">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} /></label>
          <label className="text-sm font-medium">Temporary password<input required type="text" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} autoComplete="off" /></label>
          <label className="text-sm font-medium">Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={input}>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <button type="submit" disabled={busy} className="mt-4 rounded-full bg-clay px-6 py-2.5 font-medium text-cream hover:bg-clay-deep disabled:opacity-50">{busy ? "Creating…" : "Create account"}</button>
        {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-teal-deep" : "text-clay-deep"}`}>{msg.text}</p>}
      </form>

      <section>
        <h2 className="font-display text-xl">Staff ({staff.length})</h2>
        <ul className="mt-3 space-y-2">{staff.map((u) => <Row key={u.id} u={u} />)}</ul>
      </section>
      <section>
        <h2 className="font-display text-xl">Patients ({patients.length})</h2>
        {patients.length === 0 ? <p className="mt-3 rounded-2xl bg-cream px-5 py-6 text-center text-ink/50">No patients have registered yet.</p> : <ul className="mt-3 space-y-2">{patients.map((u) => <Row key={u.id} u={u} />)}</ul>}
      </section>
    </div>
  );
}
