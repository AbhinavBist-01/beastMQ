"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, ArrowRight, Sparkles } from "lucide-react";
import { GithubIcon } from "./GithubIcon";

export function FinalCTA() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npx skills add AbhinavBist-01/beastmq");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative py-28 md:py-36 overflow-hidden border-t border-white/[0.08]">
      {/* Background Animated Stream & Glow Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#00FF66]/[0.08] blur-[140px] pointer-events-none -z-10" />

      {/* SVG Subtle Streaming Packets Flowing Behind Headline */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 opacity-20 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#00FF66" strokeWidth="1.5" strokeDasharray="8 12" />
        </svg>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-sans max-w-3xl mx-auto leading-tight">
          Your events. Your infrastructure. <br />
          <span className="text-zinc-400">
            Your rules.
          </span>
        </h2>

        {/* Supporting text */}
        <p className="mt-5 text-base sm:text-lg text-zinc-400 font-normal max-w-xl mx-auto">
          Build the systems that keep everything moving. No Redis clusters to manage. Zero dual-write consistency hazards. Pure PostgreSQL durability.
        </p>

        {/* Interactive Command & CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          
          {/* Quick Copy Command Button */}
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#00FF66]/40 text-xs font-mono text-zinc-200 transition-all shadow-[0_0_20px_rgba(0,255,102,0.1)] group active:scale-95"
          >
            <span className="flex items-center gap-2">
              <span className="text-[#00FF66] font-bold">$</span>
              <span>npx skills add AbhinavBist-01/beastmq</span>
            </span>
            <span className="text-zinc-500 group-hover:text-[#00FF66] transition-colors ml-2">
              {copied ? <Check className="w-4 h-4 text-[#00FF66]" /> : <Copy className="w-4 h-4" />}
            </span>
          </button>

          {/* GitHub CTA */}
          <a
            href="https://github.com/AbhinavBist-01/beastMQ"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#00FF66] hover:bg-[#4EFE82] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(0,255,102,0.3)] hover:shadow-[0_0_40px_rgba(0,255,102,0.5)] active:scale-95"
          >
            <GithubIcon className="w-4 h-4" />
            <span>Explore Repository</span>
          </a>

        </div>

        {/* Footnote */}
        <div className="mt-8 text-xs font-mono text-zinc-500 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
          <span>Open-source under ISC license · Certified on skills.sh standard</span>
        </div>

      </div>
    </section>
  );
}
