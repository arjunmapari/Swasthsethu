"use client";

import { BackgroundLayer } from "@/components/BackgroundLayer";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Impact } from "@/components/Impact";
import { Problem } from "@/components/Problem";
import { Roadmap } from "@/components/Roadmap";
import { ScrollStory } from "@/components/ScrollStory";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <BackgroundLayer />
      <Hero />
      <Problem />
      <ScrollStory />
      <Impact />
      <Roadmap />
      <Footer />
    </main>
  );
}
