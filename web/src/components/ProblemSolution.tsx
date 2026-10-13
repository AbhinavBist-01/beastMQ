import React from "react";
import { Check, X, Shield, Zap, Database, Cpu, Terminal, Bot } from "lucide-react";

export function ProblemSolution() {
  const rows = [
    {
      feature: "LLM Turn Timeouts",
      desc: "Slow builds, tests, or web scrapers",
      traditional: "Crashes agent turn (>15s timeout limit)",
      traditionalBad: true,
      beastmq: "Unblocks in <10ms via background fibers",
      beastmqGood: true,
      highlight: "Turn-Timeout Shield",
    },
    {
      feature: "Data Loss & Storage",
      desc: "Queue state persistence",
      traditional: "In-memory RAM (eviction & dual-write risks)",
      traditionalBad: true,
      beastmq: "100% ACID durable in your PostgreSQL DB",
      beastmqGood: true,
      highlight: "Zero Redis",
    },
    {
      feature: "Worker Crash Recovery",
      desc: "Container restarts mid-task",
      traditional: "Jobs get stuck indefinitely as 'zombies'",
      traditionalBad: true,
      beastmq: "10s Heartbeat leases auto-reclaim orphaned tasks",
      beastmqGood: true,
      highlight: "Crash-Proof",
    },
    {
      feature: "Multi-Subagent Swarms",
      desc: "Parent-child task coordination",
      traditional: "Manual state plumbing with no native traces",
      traditionalBad: true,
      beastmq: "Native parentJobId & traceId fan-in/fan-out",
      beastmqGood: true,
      highlight: "Native Hierarchy",
    },
    {
      feature: "DevOps & Cloud Cost",
      desc: "Infrastructure to maintain",
      traditional: "Dedicated Redis / RabbitMQ clusters to pay for",
      traditionalBad: true,
      beastmq: "Zero extra servers (uses existing PostgreSQL)",
      beastmqGood: true,
      highlight: "Zero Ops",
    },
    {
      feature: "Agent Ecosystem",
      desc: "Integration standard",
      traditional: "Proprietary SDKs only (not agent-native)",
      traditionalBad: true,
      beastmq: "Certified skills.sh standard for Claude, Cursor, AGY",
      beastmqGood: true,
      highlight: "Universal Skill",
    },
  ];

  return (
    <section id="problem-solution" className="py-20 md:py-28 border-t border-white/[0.08] relative">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-[#00FF66]/[0.04] blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Built to fix what breaks <br />
            <span className="text-zinc-400">in traditional queue systems.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal">
            Traditional queues were designed for web servers in 2014. BeastMQ is engineered for autonomous agents, heavy subtasks, and PostgreSQL durability.
          </p>
        </div>

        {/* Visual Difference Table Container */}
        <div className="rounded-2xl border border-white/[0.1] bg-[#0A0D12] overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.7)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              {/* Table Head */}
              <thead>
                <tr className="border-b border-white/[0.08] bg-black/60">
                  <th className="py-4 px-6 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider w-[28%]">
                    Architecture Vector
                  </th>
                  <th className="py-4 px-6 text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider w-[36%] border-l border-white/[0.06]">
                    Traditional Queues (Redis / BullMQ)
                  </th>
                  <th className="py-4 px-6 text-xs font-mono font-bold text-[#00FF66] uppercase tracking-wider w-[36%] border-l border-[#00FF66]/20 bg-[#00FF66]/[0.03]">
                    <div className="flex items-center gap-2">
                      <span>BeastMQ (Agent-Native)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#00FF66]/20 text-[#00FF66] font-bold">
                        POSTGRES
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm font-sans">
                {rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Column 1: Feature */}
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-white text-xs sm:text-sm group-hover:text-[#00FF66] transition-colors">
                        {row.feature}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-sans mt-0.5">
                        {row.desc}
                      </div>
                    </td>

                    {/* Column 2: Traditional Queues */}
                    <td className="py-4 px-6 border-l border-white/[0.06] text-zinc-400">
                      <div className="flex items-start gap-2.5">
                        <span className="p-1 rounded bg-red-500/10 text-red-400 mt-0.5 shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </span>
                        <span className="leading-relaxed">{row.traditional}</span>
                      </div>
                    </td>

                    {/* Column 3: BeastMQ */}
                    <td className="py-4 px-6 border-l border-[#00FF66]/20 bg-[#00FF66]/[0.02] text-zinc-200 font-medium">
                      <div className="flex items-start gap-2.5">
                        <span className="p-1 rounded bg-[#00FF66]/15 text-[#00FF66] mt-0.5 shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                        <div>
                          <span className="text-white leading-relaxed">{row.beastmq}</span>
                          <span className="inline-block ml-2 text-[10px] font-mono font-semibold px-2 py-0.2 rounded bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20">
                            {row.highlight}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Summary Bar */}
          <div className="px-6 py-3.5 border-t border-white/[0.08] bg-black/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-2 text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#00FF66]" />
              Zero Redis · Native PostgreSQL FOR UPDATE SKIP LOCKED · Turn-Timeout Shield
            </span>
            <span className="text-[11px] text-zinc-500">
              Certified Open Standard: skills.sh
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
