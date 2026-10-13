"use client";

import React from "react";
import { Zap, ShieldCheck, Cpu, Terminal } from "lucide-react";

export function FeatureSection() {
  return (
    <section id="features" className="py-24 md:py-32 relative">
      {/* Background radial glow */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#00FF66]/[0.03] blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#00FF66] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
            CORE CAPABILITIES
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Everything flows. <br />
            <span className="text-zinc-400">Nothing gets in the way.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal">
            Engineered from first principles with PostgreSQL row-level locks, lease heartbeats, and agent timeout shields.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* FEATURE 1: High-Throughput Messaging */}
          <div className="group relative p-7 rounded-2xl border border-white/[0.08] bg-[#0D1016]/80 hover:border-[#00FF66]/40 hover:bg-[#0D1016] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                  <Zap className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                  SKIP LOCKED CLAIM
                </span>
              </div>
              <h3 className="text-xl font-mono font-bold text-white group-hover:text-[#00FF66] transition-colors">
                High-Throughput Messaging
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                Move events between services through a clean, efficient messaging pipeline. Workers claim tasks atomically using PostgreSQL <code className="text-zinc-200 font-mono text-xs bg-white/[0.05] px-1 py-0.5 rounded">FOR UPDATE SKIP LOCKED</code>, eliminating lock contention and duplicate polling.
              </p>
            </div>

            {/* Mini Visual 1: Pipelined Event Claim Stream */}
            <div className="mt-8 p-4 rounded-xl border border-white/[0.06] bg-black/50 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/[0.05] pb-2">
                <span>SQL CLAIM TRANSACTION</span>
                <span className="text-[#00FF66]">0ms lock delay</span>
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
                  <span className="text-zinc-500">3. UPDATE status=&apos;running&apos;</span>
                  <span className="text-emerald-400">RETURNING *</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-500">
                <span>Zero row collision across 50+ concurrent workers</span>
                <span className="text-[#00FF66] font-bold">100% NON-BLOCKING</span>
              </div>
            </div>
          </div>

          {/* FEATURE 2: Reliable Delivery */}
          <div className="group relative p-7 rounded-2xl border border-white/[0.08] bg-[#0D1016]/80 hover:border-[#00FF66]/40 hover:bg-[#0D1016] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                  CRASH RECOVERY & DLQ
                </span>
              </div>
              <h3 className="text-xl font-mono font-bold text-white group-hover:text-[#00FF66] transition-colors">
                Reliable Delivery
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                Design for predictable message processing, failure handling, and controlled retries. Active 10-second heartbeats extend leases, and orphaned tasks from crashing workers are safely reclaimed without task loss.
              </p>
            </div>

            {/* Mini Visual 2: Heartbeat & Exponential Backoff Ladder */}
            <div className="mt-8 p-4 rounded-xl border border-white/[0.06] bg-black/50 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/[0.05] pb-2">
                <span>RESILIENCE WATCHDOG</span>
                <span className="text-yellow-400">Heartbeat: Active</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 py-1 text-center text-[10px]">
                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="block font-bold">Att. 1</span>
                  <span>1,000ms</span>
                </div>
                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="block font-bold">Att. 2</span>
                  <span>2,000ms</span>
                </div>
                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="block font-bold">Att. 3</span>
                  <span>4,000ms</span>
                </div>
                <div className="p-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-400">
                  <span className="block font-bold">Att. 5</span>
                  <span>dead_jobs</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-400">
                <span>Lease: 300s locked_until</span>
                <span className="text-zinc-500">DLQ Replay API: Ready</span>
              </div>
            </div>
          </div>

          {/* FEATURE 3: Built to Scale */}
          <div className="group relative p-7 rounded-2xl border border-white/[0.08] bg-[#0D1016]/80 hover:border-[#00FF66]/40 hover:bg-[#0D1016] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                  <Cpu className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                  CONCURRENCY FIBERS
                </span>
              </div>
              <h3 className="text-xl font-mono font-bold text-white group-hover:text-[#00FF66] transition-colors">
                Built to Scale
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                Explore a scalable architecture that grows with your workloads. Spawn independent worker fiber pools that dynamically back off when queues are idle and drain backlogs at full speed without hammering the database.
              </p>
            </div>

            {/* Mini Visual 3: Concurrency Fibers Monitor */}
            <div className="mt-8 p-4 rounded-xl border border-white/[0.06] bg-black/50 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/[0.05] pb-2">
                <span>FIBER CONCURRENCY POOL</span>
                <span className="text-[#00FF66]">Dynamic Polling Backoff</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Fiber #1 (Shell Commands)</span>
                  <span className="text-[#00FF66]">100ms delay · ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Fiber #2 (HTTP Webhooks)</span>
                  <span className="text-[#00FF66]">100ms delay · ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Fiber #3 (Agent Subtasks)</span>
                  <span className="text-emerald-400">100ms delay · RUNNING</span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-500">
                <span>Exponential poll delay backoff</span>
                <span className="text-zinc-300 font-mono">100ms → 5000ms idle</span>
              </div>
            </div>
          </div>

          {/* FEATURE 4: Developer-First */}
          <div className="group relative p-7 rounded-2xl border border-white/[0.08] bg-[#0D1016]/80 hover:border-[#00FF66]/40 hover:bg-[#0D1016] transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                  <Terminal className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                  ZERO INFRA OVERHEAD
                </span>
              </div>
              <h3 className="text-xl font-mono font-bold text-white group-hover:text-[#00FF66] transition-colors">
                Developer-First
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                Make integration, debugging, observability, and local development straightforward. Use the TypeScript SDK, the terminal CLI, or install the certified agent skill into Claude Code, Cursor, or Antigravity in one command.
              </p>
            </div>

            {/* Mini Visual 4: Developer Experience Terminal */}
            <div className="mt-8 p-4 rounded-xl border border-white/[0.06] bg-black/50 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 border-b border-white/[0.05] pb-2">
                <span>DEVELOPER INTERFACES</span>
                <span className="text-[#00FF66]">Direct DB + REST API</span>
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
                <p className="flex items-center gap-2">
                  <span className="text-[#00FF66]">$</span>
                  <span>npx beastmq trace session_99</span>
                </p>
              </div>
              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-400">
                <span>Zero background daemons required</span>
                <span className="text-[#00FF66] font-semibold">100% EMBEDDED</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
