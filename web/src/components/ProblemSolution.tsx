import React from "react";
import { AlertCircle, CheckCircle2, Clock, Database, ShieldAlert, ShieldCheck, Zap, RefreshCw } from "lucide-react";

export function ProblemSolution() {
  const comparisons = [
    {
      title: "Tool & Turn Timeouts",
      problemTitle: "AI Agent Turn Timeout Crash",
      problemDesc: "LLMs wait >15 seconds on heavy tasks (builds, web scrapers, data crunching), causing tool timeouts, session loss, and failed agent workflows.",
      solutionTitle: "Turn-Timeout Shield (<10ms)",
      solutionDesc: "The agent offloads heavy commands to a background worker in a single instant tool call. The LLM turn stays unblocked and responsive.",
    },
    {
      title: "Data Loss Hazards",
      problemTitle: "Redis RAM Eviction & Dual-Writes",
      problemDesc: "Redis queues risk losing active state during memory pressure or container restarts. Keeping Postgres and Redis in sync requires messy dual-write logic.",
      solutionTitle: "100% PostgreSQL ACID Durability",
      solutionDesc: "Zero Redis needed. Uses your existing PostgreSQL database with row-level locks (SKIP LOCKED). Your tasks live in the exact same database as your data.",
    },
    {
      title: "Worker Crashes",
      problemTitle: "Stuck 'Zombie' Jobs",
      problemDesc: "When background workers crash mid-task in traditional queues, jobs often hang indefinitely in 'processing' state or run multiple times uncontrollably.",
      solutionTitle: "Lease Heartbeats & Auto-Recovery",
      solutionDesc: "Active 10s heartbeats keep worker leases alive. If a container crashes, the lease expires and another worker claims it with zero manual intervention.",
    },
  ];

  return (
    <section id="problem-solution" className="py-20 md:py-28 border-t border-white/[0.08] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header: Short, Direct */}
        <div className="max-w-3xl mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#00FF66] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
            WHY IT EXISTS
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Built to fix what breaks <br />
            <span className="text-zinc-400">in AI agent architectures.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal">
            Most queues were built for web servers in 2014. BeastMQ is designed for autonomous coding agents, subagent swarms, and heavy background workloads today.
          </p>
        </div>

        {/* 3 Side-by-Side Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparisons.map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.08] bg-[#0A0D12] overflow-hidden flex flex-col justify-between"
            >
              {/* Top Tag */}
              <div className="px-5 py-3 border-b border-white/[0.06] bg-black/40 text-xs font-mono font-bold text-white flex items-center justify-between">
                <span>0{i + 1} · {c.title}</span>
              </div>

              {/* Red: The Problem */}
              <div className="p-5 border-b border-white/[0.06] bg-red-950/10 space-y-2">
                <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Without BeastMQ</span>
                </div>
                <h4 className="text-sm font-bold text-zinc-200 font-sans">{c.problemTitle}</h4>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  {c.problemDesc}
                </p>
              </div>

              {/* Green: The Solution */}
              <div className="p-5 bg-[#00FF66]/[0.03] space-y-2 flex-1">
                <div className="flex items-center gap-2 text-[#00FF66] text-xs font-mono font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>With BeastMQ</span>
                </div>
                <h4 className="text-sm font-bold text-white font-sans">{c.solutionTitle}</h4>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  {c.solutionDesc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
