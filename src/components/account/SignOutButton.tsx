"use client";

export function SignOutButton({ label, className }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      className={className ?? "rounded-full px-3 py-1.5 text-sm text-ink/60 hover:bg-ink/8 hover:text-ink"}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        // A full page load (not router.push) so no cached page of the signed-out user survives.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
      }}
    >
      {label}
    </button>
  );
}
