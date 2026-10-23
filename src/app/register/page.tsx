import { redirect } from "next/navigation";
import { AuthForm } from "@/components/account/AuthForm";
import { safeNext } from "@/lib/safeNext";
import { getSessionUser, homeFor } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeNext((await searchParams).next);
  const user = await getSessionUser();
  if (user) redirect(user.role === "patient" && next ? next : homeFor(user.role));
  return <AuthForm mode="register" next={next} />;
}
