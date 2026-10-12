import React from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { MetricsStrip } from "@/components/MetricsStrip";
import { FeatureSection } from "@/components/FeatureSection";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { CodeShowcase } from "@/components/CodeShowcase";
import { DeveloperExperience } from "@/components/DeveloperExperience";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#08090B] text-[#F3F4F6] selection:bg-[#00FF66] selection:text-[#08090B] flex flex-col">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Main Page Content */}
      <main className="flex-1">
        {/* 1. Hero Section with Prominent npx skills add () command and animated message stream */}
        <HeroSection />

        {/* 2. Technical Metrics Strip */}
        <MetricsStrip />

        {/* 3. Core Features with Custom Mini-Visuals */}
        <FeatureSection />

        {/* 4. Horizontal Architecture Flow & Inspection */}
        <ArchitectureDiagram />

        {/* 5. Code Section with TypeScript SDK & Interactive Terminal Simulator */}
        <CodeShowcase />

        {/* 6. Developer Experience & CLI Workflows */}
        <DeveloperExperience />

        {/* 7. Final Closing CTA */}
        <FinalCTA />
      </main>

      {/* 8. Footer */}
      <Footer />
    </div>
  );
}
