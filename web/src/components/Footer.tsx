import React from "react";
import Link from "next/link";
import { BeastBrand } from "./BeastLogo";
import { ArrowUpRight, Terminal, ShieldCheck } from "lucide-react";
import { GithubIcon } from "./GithubIcon";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050709] text-zinc-400 font-sans text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Info (Cols 1-5) */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-block">
              <BeastBrand />
            </Link>
            <p className="text-sm text-zinc-400 font-normal leading-relaxed max-w-sm">
              The agent-native distributed task queue & workflow engine backed by PostgreSQL ACID row-locks. Zero Redis. Strict durability.
            </p>

            {/* Live Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-[11px] font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              <span>ALL SYSTEMS OPERATIONAL (POSTGRES ACID)</span>
            </div>
          </div>

          {/* Links Column 1: Architecture & Engine (Cols 6-8) */}
          <div className="md:col-span-3 space-y-3 font-mono">
            <h4 className="text-xs uppercase font-bold tracking-wider text-white">
              Architecture
            </h4>
            <ul className="space-y-2 text-zinc-400 text-xs">
              <li>
                <a href="#architecture" className="hover:text-[#00FF66] transition-colors">
                  FOR UPDATE SKIP LOCKED
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#00FF66] transition-colors">
                  Lease & Heartbeat Model
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#00FF66] transition-colors">
                  Distributed Idempotency
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#00FF66] transition-colors">
                  Dead Letter Queue (dead_jobs)
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Interfaces & Tooling (Cols 9-10) */}
          <div className="md:col-span-2 space-y-3 font-mono">
            <h4 className="text-xs uppercase font-bold tracking-wider text-white">
              Interfaces
            </h4>
            <ul className="space-y-2 text-zinc-400 text-xs">
              <li>
                <a href="#code" className="hover:text-[#00FF66] transition-colors">
                  TypeScript SDK
                </a>
              </li>
              <li>
                <a href="#developer-experience" className="hover:text-[#00FF66] transition-colors">
                  npx beastmq CLI
                </a>
              </li>
              <li>
                <a
                  href="https://skills.sh"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#00FF66] transition-colors flex items-center gap-1"
                >
                  <span>skills.sh Standard</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abhinavbist/beastMQ"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#00FF66] transition-colors flex items-center gap-1"
                >
                  <span>REST API Router</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Open Source & Community (Cols 11-12) */}
          <div className="md:col-span-2 space-y-3 font-mono">
            <h4 className="text-xs uppercase font-bold tracking-wider text-white">
              Open Source
            </h4>
            <ul className="space-y-2 text-zinc-400 text-xs">
              <li>
                <a
                  href="https://github.com/abhinavbist/beastMQ"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#00FF66] transition-colors flex items-center gap-1"
                >
                  <GithubIcon className="w-3 h-3" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abhinavbist/beastMQ/blob/master/README.md"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#00FF66] transition-colors flex items-center gap-1"
                >
                  <span>Documentation</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/abhinavbist/beastMQ/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#00FF66] transition-colors flex items-center gap-1"
                >
                  <span>Issue Tracker</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-zinc-500">
          <div>
            © {new Date().getFullYear()} BeastMQ. Released under the ISC License.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00FF66]" />
              Zero Redis · Native PostgreSQL Durability
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
