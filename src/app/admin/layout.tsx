import type { Metadata } from "next";
import { StaffShell } from "@/components/doctor/StaffShell";

export const metadata: Metadata = { title: "Admin — Swasthsethu", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
