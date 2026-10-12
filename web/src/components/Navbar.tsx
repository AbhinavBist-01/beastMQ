"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BeastBrand } from "./BeastLogo";
import { Copy, Check, Menu, X, ArrowUpRight, Terminal, Sparkles } from "lucide-react";

export function Navbar() {
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyCommand = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText("npx skills add beastmq");
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "bg-[#08090B]/90 backdrop-blur-md border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-[#08090B]/60 backdrop-blur-sm border-b border-white/[0.04]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <Link href="/" className="group flex items-center gap-2 outline-none">
          <BeastBrand />
          <span className="hidden sm:inline-flex items-center text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66]">
            v1.0 ACID
          </span>
        </Link>

        {/* Center: Nav links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono tracking-wide text-zinc-400">
          <a
            href="#architecture"
            className="hover:text-white transition-colors py-1"
          >
            ARCHITECTURE
          </a>
          <a
            href="#features"
            className="hover:text-white transition-colors py-1"
          >
            CAPABILITIES
          </a>
          <a
            href="#code"
            className="hover:text-white transition-colors py-1"
          >
            SDK & SPEC
          </a>
          <a
            href="#developer-experience"
            className="hover:text-white transition-colors py-1"
          >
            CLI & DX
          </a>
          <a
            href="https://github.com/abhinavbist/beastMQ"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors py-1 flex items-center gap-1 group"
          >
            <span>GITHUB</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-[#00FF66] transition-colors" />
          </a>
        </nav>

        {/* Right side CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Quick Skill command copy button */}
          <button
            onClick={copyCommand}
            className="group relative flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] hover:border-[#00FF66]/40 hover:bg-[#00FF66]/5 transition-all text-xs font-mono text-zinc-300"
            title="Click to copy install command"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
            <span className="text-zinc-500">$</span>
            <span className="text-zinc-300 group-hover:text-white transition-colors">
              npx skills add beastmq
            </span>
            <span className="text-zinc-500 group-hover:text-[#00FF66] ml-1">
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#00FF66]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </span>
            {copied && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[#00FF66] text-[#08090B] text-[10px] font-bold shadow-lg">
                COPIED!
              </span>
            )}
          </button>

          {/* Primary Action Button */}
          <a
            href="#code"
            className="relative inline-flex items-center justify-center px-4 py-1.5 rounded-md text-xs font-mono font-semibold tracking-wider uppercase text-black bg-[#00FF66] hover:bg-[#4EFE82] transition-all shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:shadow-[0_0_25px_rgba(0,255,102,0.5)] active:scale-95"
          >
            Get Started
          </a>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={copyCommand}
            className="p-2 rounded border border-white/[0.1] text-xs font-mono text-zinc-300 bg-white/[0.04]"
            aria-label="Copy install command"
          >
            {copied ? <Check className="w-4 h-4 text-[#00FF66]" /> : <Terminal className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded text-zinc-400 hover:text-white hover:bg-white/[0.05]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#08090B]/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-3 text-sm font-mono text-zinc-300">
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#00FF66]"
            >
              ARCHITECTURE
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#00FF66]"
            >
              CAPABILITIES
            </a>
            <a
              href="#code"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#00FF66]"
            >
              SDK & SPEC
            </a>
            <a
              href="#developer-experience"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#00FF66]"
            >
              CLI & DX
            </a>
            <a
              href="https://github.com/abhinavbist/beastMQ"
              target="_blank"
              rel="noreferrer"
              className="py-1 text-zinc-400 flex items-center justify-between"
            >
              <span>GITHUB REPOSITORY</span>
              <ArrowUpRight className="w-4 h-4 text-[#00FF66]" />
            </a>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
            <button
              onClick={copyCommand}
              className="w-full flex items-center justify-between px-3 py-2 rounded border border-white/[0.1] bg-white/[0.02] text-xs font-mono text-zinc-300"
            >
              <span>$ npx skills add beastmq</span>
              {copied ? <Check className="w-4 h-4 text-[#00FF66]" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href="#code"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded font-mono font-bold text-xs uppercase text-black bg-[#00FF66]"
            >
              Get Started →
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
