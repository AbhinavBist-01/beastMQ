import React from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ProblemSolution } from "@/components/ProblemSolution";
import { SkillsEcosystem } from "@/components/SkillsEcosystem";
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
      {/* Sticky Minimal Navigation */}
      <Navbar />

      {/* Main Page Flow */}
      <main className="flex-1">
        {/* 1. Hero Section with Interactive 3D WebGL Event Mesh */}
        <HeroSection />

        {/* 2. Before vs. After: The 3 Fatal Problems AI Agents Face */}
        <ProblemSolution />

        {/* 3. Universal Open Skill: Certified on skills.sh */}
        <SkillsEcosystem />

        {/* 4. Technical Architectural Metrics */}
        <MetricsStrip />

        {/* 5. Core Capabilities (Zero Bloat, Direct Explanations) */}
        <FeatureSection />

        {/* 6. Horizontal Distributed Topology & Lifecycle */}
        <ArchitectureDiagram />

        {/* 7. Code Section with TypeScript SDK & IDE Simulation */}
        <CodeShowcase />

        {/* 8. Developer Experience & CLI Workflows */}
        <DeveloperExperience />

        {/* 9. Final Call to Action */}
        <FinalCTA />
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  );
}
