"use client";

import React, { useState } from "react";
import { MessageFlowVisualization } from "./MessageFlowVisualization";
import { Copy, Check, ArrowRight } from "lucide-react";
import { GithubIcon } from "./GithubIcon";

export function HeroSection() {
  const [copied, setCopied] = useState(false);

  const command = "npx skills add AbhinavBist-01/beastmq";

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#00FF66]/[0.07] blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-24 left-1/4 w-[350px] h-[350px] bg-emerald-500/[0.04] blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Text Content */}
        <div className="max-w-3xl mx-auto text-center space-y-6 mb-12">
          
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

          {/* Clean NPX SKILLS ADD Command Bar (Zero scroll, perfectly fitted) */}
          <div className="pt-2 pb-1 max-w-md mx-auto">
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.12] bg-[#0D1016]/90 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,102,0.08)]">
              <div className="flex items-center gap-2.5 font-mono text-xs sm:text-sm text-left">
                <span className="text-[#00FF66] select-none font-bold">$</span>
                <span className="text-zinc-100 font-medium whitespace-nowrap">
                  {command}
                </span>
              </div>
              
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#00FF66] hover:bg-[#4EFE82] text-black font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,255,102,0.25)] active:scale-95 shrink-0 ml-3"
                aria-label="Copy install command"
              >
                {copied ? (
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
            <p className="text-[11px] font-mono text-zinc-500 mt-2 text-center">
              Universal Skill for Claude Code, Cursor, Windsurf, &amp; Antigravity
            </p>
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
              href="https://github.com/AbhinavBist-01/beastMQ"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.25] text-zinc-200 hover:text-white font-mono text-sm tracking-wide transition-all active:scale-95"
            >
              <GithubIcon className="w-4 h-4" />
              <span>View on GitHub ↗</span>
            </a>
          </div>

          {/* Status Indicator (Clean text without pinging green dot) */}
          <div className="pt-3">
            <p className="text-[11px] font-mono tracking-widest uppercase text-zinc-500">
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
