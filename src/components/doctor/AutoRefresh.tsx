"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Keeps the waiting-room queue current without a manual reload. */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(t);
  }, [router, seconds]);
  return null;
}
