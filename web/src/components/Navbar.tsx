"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GithubIcon } from "./GithubIcon";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#08090B]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          : "bg-transparent border-b border-white/[0.04]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Clean Brand Wordmark */}
        <Link
          href="/"
          className="text-base font-mono font-extrabold tracking-tight text-white hover:text-[#00FF66] transition-colors outline-none"
        >
          beast<span className="text-[#166d39]">MQ</span>
        </Link>

        {/* Center: Refined Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-sans font-medium text-zinc-400">
          <a
            href="#features"
            className="hover:text-white transition-colors duration-150 py-1"
          >
            Features
          </a>
          <a
            href="#architecture"
            className="hover:text-white transition-colors duration-150 py-1"
          >
            Architecture
          </a>
          <a
            href="#code"
            className="hover:text-white transition-colors duration-150 py-1"
          >
            SDK
          </a>
          <a
            href="#developer-experience"
            className="hover:text-white transition-colors duration-150 py-1"
          >
            Terminal
          </a>
        </nav>

        {/* Right Side: Sleek, Minimalist Repository Icon Link */}
        <div className="hidden md:flex items-center">
          <a
            href="https://github.com/AbhinavBist-01/beastMQ"
            target="_blank"
            rel="noreferrer"
            aria-label="View BeastMQ on GitHub"
            className="flex items-center justify-center p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all duration-150"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Clean & Minimal) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#08090B]/98 backdrop-blur-2xl px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3.5 text-sm font-sans font-medium text-zinc-300">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#00FF66] transition-colors"
            >
              Features
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#00FF66] transition-colors"
            >
              Architecture
            </a>
            <a
              href="#code"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#00FF66] transition-colors"
            >
              SDK
            </a>
            <a
              href="#developer-experience"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#00FF66] transition-colors"
            >
              Terminal
            </a>
            <a
              href="https://github.com/AbhinavBist-01/beastMQ"
              target="_blank"
              rel="noreferrer"
              className="pt-2 border-t border-white/[0.06] flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <GithubIcon className="w-4 h-4" />
              <span>GitHub </span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
