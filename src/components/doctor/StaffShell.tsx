import Link from "next/link";
import { SignOutButton } from "@/components/account/SignOutButton";
import { getSessionUser } from "@/server/auth";

/** Header + page frame shared by /doctor and /admin. */
export async function StaffShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const staff = user && user.role !== "patient";
  return (
    <div className="min-h-[100svh] bg-paper text-ink">
      <header className="border-b border-ink/10 bg-cream/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/doctor" className="font-display text-lg">
            Swasthsethu <span className="text-sm text-ink/50">· Clinician console</span>
          </Link>
          {staff && (
            <div className="flex items-center gap-1 text-sm">
              <Link href="/doctor" className="rounded-full px-3 py-1.5 text-ink/70 hover:bg-ink/8">Cases</Link>
              {user.role === "admin" && <Link href="/admin" className="rounded-full px-3 py-1.5 text-ink/70 hover:bg-ink/8">Admin</Link>}
              <span className="hidden px-2 text-ink/50 sm:inline">{user.name} · {user.role}</span>
              <SignOutButton label="Sign out" />
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-6">{children}</main>
    </div>
  );
}
