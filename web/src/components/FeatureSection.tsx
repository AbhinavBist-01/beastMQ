"use client";

import React from "react";
import { Zap, ShieldCheck, Cpu, Terminal } from "lucide-react";

export function FeatureSection() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      {/* Background radial glow */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#00FF66]/[0.03] blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Everything you need for background jobs. <br />
            <span className="text-zinc-400">Zero additional infrastructure.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal">
            Turn your existing PostgreSQL database into a distributed job queue and multi-agent execution engine.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* FEATURE 1: Atomic SKIP LOCKED Claims */}
          <div className="group relative p-6 rounded-2xl border border-white/[0.08] bg-[#0D1016]/80 hover:border-[#00FF66]/40 hover:bg-[#0D1016] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                  <Zap className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                  SQL ROW-LOCKS
                </span>
              </div>
              <h3 className="text-lg font-mono font-bold text-white group-hover:text-[#00FF66] transition-colors">
                Atomic Multi-Worker Claims
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Workers claim jobs using PostgreSQL <code className="text-zinc-200 font-mono text-xs bg-white/[0.05] px-1 py-0.5 rounded">FOR UPDATE SKIP LOCKED</code>. Zero lock collisions, zero duplicate polling, and zero Redis memory hazards.
              </p>
            </div>

            {/* Mini Visual 1: Pipelined Event Claim Stream */}
            <div className="mt-6 p-4 rounded-xl border border-white/[0.06] bg-black/50 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/[0.05] pb-2">
                <span>SQL CLAIM TRANSACTION</span>
                <span className="text-[#00FF66]">Atomic &amp; Non-blocking</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">1. SELECT id FROM jobs</span>
                  <span className="text-zinc-400">ORDER BY priority DESC</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">2. FOR UPDATE</span>
                  <span className="text-[#00FF66] font-semibold">SKIP LOCKED</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">3. SET status=&apos;running&apos;</span>
                  <span className="text-emerald-400">locked_by = worker_id</span>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 2: Heartbeats & Crash Recovery */}
          <div className="group relative p-6 rounded-2xl border border-white/[0.08] bg-[#0D1016]/80 hover:border-[#00FF66]/40 hover:bg-[#0D1016] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                  AUTO-RECOVERY
                </span>
              </div>
              <h3 className="text-lg font-mono font-bold text-white group-hover:text-[#00FF66] transition-colors">
                Lease Heartbeats &amp; DLQ
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Active 10s heartbeats keep worker leases alive. If a container dies, the lease expires and another worker reclaims it. Permanently failed jobs move to <code className="text-zinc-200 font-mono text-xs bg-white/[0.05] px-1 py-0.5 rounded">dead_jobs</code> for instant replay.
              </p>
            </div>

            {/* Mini Visual 2: Heartbeat & Exponential Backoff Ladder */}
            <div className="mt-6 p-4 rounded-xl border border-white/[0.06] bg-black/50 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/[0.05] pb-2">
                <span>EXPONENTIAL BACKOFF RETRY</span>
                <span className="text-yellow-400">Heartbeat: 10s</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 py-1 text-center text-[10px]">
                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="block font-bold">Try 1</span>
                  <span>1s delay</span>
                </div>
                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="block font-bold">Try 2</span>
                  <span>2s delay</span>
                </div>
                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="block font-bold">Try 3</span>
                  <span>4s delay</span>
                </div>
                <div className="p-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                  <span className="block font-bold">Try 5</span>
                  <span>dead_jobs</span>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 3: Timeout Shield & AbortSignal */}
          <div className="group relative p-6 rounded-2xl border border-white/[0.08] bg-[#0D1016]/80 hover:border-[#00FF66]/40 hover:bg-[#0D1016] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                  <Cpu className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                  AGENT SAFETY
                </span>
              </div>
              <h3 className="text-lg font-mono font-bold text-white group-hover:text-[#00FF66] transition-colors">
                Turn-Timeout Shield &amp; AbortSignals
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Jobs run with Node <code className="text-zinc-200 font-mono text-xs bg-white/[0.05] px-1 py-0.5 rounded">AbortController</code> watchdogs. Runaway shell commands and HTTP requests are killed cleanly on timeout before they drain resources.
              </p>
            </div>

            {/* Mini Visual 3: Concurrency Fibers Monitor */}
            <div className="mt-6 p-4 rounded-xl border border-white/[0.06] bg-black/50 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/[0.05] pb-2">
                <span>EXECUTION TIMEOUT WATCHDOG</span>
                <span className="text-[#00FF66]">AbortSignal Active</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">agent.command (child_process)</span>
                  <span className="text-[#00FF66]">Signal monitored</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">agent.http (fetch stream)</span>
                  <span className="text-[#00FF66]">Auto-aborted at 30s</span>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 4: Universal Agent Skill */}
          <div className="group relative p-6 rounded-2xl border border-white/[0.08] bg-[#0D1016]/80 hover:border-[#00FF66]/40 hover:bg-[#0D1016] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                  <Terminal className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                  AGENT-NATIVE
                </span>
              </div>
              <h3 className="text-lg font-mono font-bold text-white group-hover:text-[#00FF66] transition-colors">
                Universal Agent Skill &amp; CLI
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Certified for <code className="text-zinc-200 font-mono text-xs bg-white/[0.05] px-1 py-0.5 rounded">skills.sh</code>. AI agents use BeastMQ under the hood to coordinate multi-subagent workflows, fan-out tasks, and inspect outputs without human setup.
              </p>
            </div>

            {/* Mini Visual 4: Terminal Command */}
            <div className="mt-6 p-4 rounded-xl border border-white/[0.06] bg-black/50 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/[0.05] pb-2">
                <span>AUTONOMOUS AGENT ORCHESTRATION</span>
                <span className="text-[#00FF66]">CLI + Direct DB</span>
              </div>
              <div className="space-y-1 text-[11px] text-zinc-400">
                <p className="flex items-center gap-2">
                  <span className="text-[#00FF66]">$</span>
                  <span>npx skills add AbhinavBist-01/beastmq</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#00FF66]">$</span>
                  <span>npx beastmq worker --drain</span>
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
