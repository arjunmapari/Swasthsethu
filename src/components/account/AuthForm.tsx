"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { accountCopy } from "@/data/account.copy";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const { locale } = useLanguage();
  const t = accountCopy[locale];
  const register = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Until the page's JavaScript has loaded, the form must not submit: a native submit could put
  // the email and password in the address bar. method="post" below is the second safety net.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(register ? { name, email, password } : { email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? t.networkError);
        return;
      }
      // Patients may continue to where they were going (e.g. /demo); staff always go to their console.
      const target = data.user.role === "patient" && next ? next : data.redirect;
      window.location.assign(target); // full load so the new session cookie is used everywhere
    } catch {
      setError(t.networkError);
    } finally {
      setBusy(false);
    }
  };

  const field = "mt-1 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 outline-none focus:border-clay";
  const other = `${register ? "/login" : "/register"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="font-display text-xl text-ink">
          Swasthsethu
        </Link>
        <LanguageSwitcher compact />
      </div>
      <form onSubmit={submit} method="post" className="rounded-[1.4rem] bg-cream p-6 shadow-xl">
        <h1 className="font-display text-2xl text-ink">{register ? t.registerTitle : t.signInTitle}</h1>
        <p className="mt-1 text-sm text-ink/60">{register ? t.registerSub : t.signInSub}</p>

        {register && (
          <>
            <label htmlFor="name" className="mt-5 block text-sm font-medium text-ink">{t.name}</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} required className={field} />
          </>
        )}
        <label htmlFor="email" className="mt-4 block text-sm font-medium text-ink">{t.email}</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} required className={field} />
        <label htmlFor="password" className="mt-4 block text-sm font-medium text-ink">{t.password}</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={register ? "new-password" : "current-password"}
          minLength={register ? 8 : undefined}
          maxLength={200}
          required
          className={field}
        />
        {register && <p className="mt-1 text-xs text-ink/50">{t.passwordHint}</p>}

        {error && <p role="alert" className="mt-4 rounded-lg bg-clay/10 px-3 py-2 text-sm text-clay-deep">{error}</p>}

        <button
          type="submit"
          disabled={busy || !ready}
          className="mt-6 w-full rounded-full bg-clay py-3 font-medium text-cream transition enabled:hover:bg-clay-deep disabled:opacity-50"
        >
          {busy ? (register ? t.creating : t.signingIn) : register ? t.createAccount : t.signIn}
        </button>

        <p className="mt-5 text-center text-sm text-ink/60">
          {register ? t.haveAccount : t.noAccount}{" "}
          <Link href={other} className="font-medium text-clay hover:underline">
            {register ? t.signInInstead : t.createOne}
          </Link>
        </p>
        {!register && <p className="mt-2 text-center text-xs text-ink/40">{t.staffNote}</p>}
      </form>
    </div>
  );
}
