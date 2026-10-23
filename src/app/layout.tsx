import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Swasthsethu — the patient's story, before they walk in",
  description:
    "A kiosk in the waiting room that takes history in the patient's language and hands the doctor a clean summary.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${figtree.variable} font-sans antialiased`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
