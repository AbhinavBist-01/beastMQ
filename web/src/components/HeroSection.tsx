"use client";

import React, { useState } from "react";
import { Hero3DStream } from "./Hero3DStream";
import { Copy, Check, ArrowRight, ShieldCheck, Zap } from "lucide-react";
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
    <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#00FF66]/[0.07] blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Text Content */}
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-10">
          
          {/* Main Headline: Clear, Direct, No Jargon */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-sans leading-[1.1]">
            The background task queue <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-[#00FF66]">
              built for AI agents & apps.
            </span>
          </h1>

          {/* Supporting Text: Explaining Exactly What It Does */}
          <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Offload slow builds, web scrapers, and subagent workflows into background workers using your existing <strong>PostgreSQL</strong> database.
            <span className="text-zinc-400 block mt-1">Zero Redis. Zero LLM turn timeouts. Automatic worker crash recovery.</span>
          </p>

          {/* Clean NPX SKILLS ADD Command Bar */}
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
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <a
              href="#problem-solution"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00FF66] hover:bg-[#4EFE82] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(0,255,102,0.35)] active:scale-95"
            >
              <span>See How It Works</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://github.com/AbhinavBist-01/beastMQ"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.25] text-zinc-200 hover:text-white font-mono text-xs tracking-wide transition-all active:scale-95"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub (Open Source)</span>
            </a>
          </div>

        </div>

        {/* Hero Visual: 3D Interactive WebGL Stream Mesh */}
        <div className="mt-8">
          <Hero3DStream />
        </div>

      </div>
    </section>
  );
}
