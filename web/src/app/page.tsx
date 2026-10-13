import React from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ProblemSolution } from "@/components/ProblemSolution";
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
        {/* 1. Hero Section with Live Interactive Job Engine Sandbox */}
        <HeroSection />

        {/* 2. Before vs. After: Why AI Agents & Apps Need BeastMQ */}
        <ProblemSolution />

        {/* 3. Technical Metrics Strip */}
        <MetricsStrip />

        {/* 4. Core Capabilities & Primitives */}
        <FeatureSection />

        {/* 5. Horizontal Architecture Topology & Lifecycle */}
        <ArchitectureDiagram />

        {/* 6. Code Section with TypeScript SDK & Interactive Terminal */}
        <CodeShowcase />

        {/* 7. Developer Experience & CLI Workflows */}
        <DeveloperExperience />

        {/* 8. Final Closing Call to Action */}
        <FinalCTA />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
}
