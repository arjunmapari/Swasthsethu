import type { Metadata } from "next";
import { StaffShell } from "@/components/doctor/StaffShell";

export const metadata: Metadata = { title: "Clinician console — Swasthsethu", robots: { index: false, follow: false } };

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <StaffShell>{children}</StaffShell>;
}
