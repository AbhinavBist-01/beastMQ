"use client";

import React, { useState } from "react";
import { MessageFlowVisualization } from "./MessageFlowVisualization";
import { Copy, Check, Terminal, ArrowRight, Github, Sparkles, Zap, Shield, Cpu } from "lucide-react";

export function HeroSection() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeSnippet, setActiveSnippet] = useState<"skill" | "cli" | "npm">("skill");

  const snippets = {
    skill: "npx skills add beastmq",
    cli: "npx beastmq enqueue --cmd \"npm run build\" --role \"builder\"",
    npm: "npm install beastmq drizzle-orm pg",
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#00FF66]/[0.07] blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-24 left-1/4 w-[350px] h-[350px] bg-emerald-500/[0.04] blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Text Content */}
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-12">
          
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/10 text-xs font-mono font-medium tracking-wider text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
            <span>MESSAGING INFRASTRUCTURE, REIMAGINED</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-sans leading-[1.08]">
            Move events at <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#00FF66]">
              beast speed.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Reliable messaging infrastructure for systems that never stop moving. Build, stream, and process events without slowing down your architecture.
          </p>

          {/* Prominent NPX SKILLS ADD Command Bar (Highlighted by User) */}
          <div className="pt-2 pb-1 max-w-xl mx-auto">
            <div className="p-1 rounded-xl border border-white/[0.12] bg-[#0D1016]/90 backdrop-blur-md shadow-[0_0_35px_rgba(0,255,102,0.12)]">
              {/* Snippet mode tabs */}
              <div className="flex items-center justify-between px-3 pt-2 pb-1.5 border-b border-white/[0.06] text-[11px] font-mono text-zinc-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>INSTALL SKILL / CLI</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveSnippet("skill")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      activeSnippet === "skill"
                        ? "bg-[#00FF66]/20 text-[#00FF66] font-semibold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    skills.sh
                  </button>
                  <button
                    onClick={() => setActiveSnippet("cli")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      activeSnippet === "cli"
                        ? "bg-[#00FF66]/20 text-[#00FF66] font-semibold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    npx beastmq
                  </button>
                  <button
                    onClick={() => setActiveSnippet("npm")}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      activeSnippet === "npm"
                        ? "bg-[#00FF66]/20 text-[#00FF66] font-semibold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    npm package
                  </button>
                </div>
              </div>

              {/* Interactive Copyable Terminal Bar */}
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-left overflow-x-auto select-all">
                  <span className="text-[#00FF66] select-none font-bold">$</span>
                  <span className="text-zinc-100 whitespace-nowrap">
                    {snippets[activeSnippet]}
                  </span>
                </div>
                
                <button
                  onClick={() => handleCopy(snippets[activeSnippet], 99)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#00FF66] hover:bg-[#4EFE82] text-black font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)] active:scale-95 shrink-0"
                  aria-label="Copy command"
                >
                  {copiedIndex === 99 ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
              <span>Certified Universal Skill for Claude Code, Cursor, Windsurf, & Antigravity</span>
            </div>
          </div>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#architecture"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00FF66] hover:bg-[#4EFE82] text-black font-mono font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(0,255,102,0.35)] hover:shadow-[0_0_40px_rgba(0,255,102,0.6)] active:scale-95"
            >
              <span>Explore BeastMQ</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="https://github.com/abhinavbist/beastMQ"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.25] text-zinc-200 hover:text-white font-mono text-sm tracking-wide transition-all active:scale-95"
            >
              <Github className="w-4 h-4" />
              <span>View on GitHub ↗</span>
            </a>
          </div>

          {/* Status Indicator */}
          <div className="pt-3">
            <p className="text-[11px] font-mono tracking-widest uppercase text-zinc-500 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#00FF66]/80 animate-ping" />
              BUILT FOR DEVELOPERS · ENGINEERED FOR SCALE
            </p>
          </div>

        </div>

        {/* Hero Visual: Custom Animated Message-Stream Architecture */}
        <div className="mt-8">
          <MessageFlowVisualization />
        </div>

      </div>
    </section>
  );
}
