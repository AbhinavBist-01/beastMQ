"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Database, Server, CheckCircle2, Play, Sparkles, Clock, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  role: string;
  type: string;
  payload: Record<string, any>;
  duration: number;
  output: Record<string, any>;
  why: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "build",
    name: "Offload Slow Build / Test",
    role: "build_runner",
    type: "agent.command",
    payload: { command: "npm run build && npm test", cwd: "/app" },
    duration: 1800,
    output: { exitCode: 0, stdout: "✓ 48 tests passed in 1.8s", durationMs: 1840 },
    why: "Prevents LLM turn timeouts (>15s). The agent enqueues this and stays unblocked.",
  },
  {
    id: "scrape",
    name: "Async Web Scraping & APIs",
    role: "researcher",
    type: "agent.http",
    payload: { url: "https://api.github.com/repos/AbhinavBist-01/beastMQ", method: "GET" },
    duration: 1200,
    output: { status: 200, stars: 142, forks: 19, latencyMs: 340 },
    why: "Fetches heavy data in the background without blocking the prompt loop.",
  },
  {
    id: "subagents",
    name: "Multi-Subagent Swarm Fan-Out",
    role: "supervisor",
    type: "agent.swarm",
    payload: { parentId: "task_99", subtasks: 3, traceId: "trace_audit_01" },
    duration: 2200,
    output: { subtasksCompleted: 3, totalIssuesFound: 0, fanInStatus: "allCompleted" },
    why: "Coordinates child subagents in parallel with parentJobId hierarchy.",
  },
];

export function MessageFlowVisualization() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]!);
  const [stage, setStage] = useState<"idle" | "enqueuing" | "claimed" | "completed">("completed");
  const [activeJobId, setActiveJobId] = useState("a81f9b02-44df-4192");
  const [executionLog, setExecutionLog] = useState<string>("✓ Job completed in 1.8s. Results saved in jobs.result");

  const runSimulation = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setStage("enqueuing");
    const newId = Math.random().toString(36).substring(2, 10) + "-44df";
    setActiveJobId(newId);
    setExecutionLog(`1. Enqueued to PostgreSQL jobs table (status: pending)...`);

    setTimeout(() => {
      setStage("claimed");
      setExecutionLog(`2. Claimed via FOR UPDATE SKIP LOCKED. Worker heartbeat active.`);
    }, 700);

    setTimeout(() => {
      setStage("completed");
      setExecutionLog(`3. Finished. Result stored in jobs.result JSONB. Zero agent timeouts.`);
    }, scenario.duration);
  };

  return (
    <div className="w-full rounded-2xl border border-white/[0.1] bg-[#0A0D12]/95 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden">
      
      {/* Top Bar: Live interactive scenario picker */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-black/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Interactive Playground: See What BeastMQ Does
          </span>
        </div>

        {/* Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => runSimulation(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 ${
                selectedScenario.id === s.id
                  ? "bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/40 font-bold shadow-[0_0_15px_rgba(0,255,102,0.15)]"
                  : "bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:text-white hover:border-white/[0.15]"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visual: 3 Concrete Physical Stages */}
      <div className="p-6 sm:p-8 bg-grid-pattern relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          
          {/* STAGE 1: AI Agent or Client */}
          <div className={`p-5 rounded-xl border transition-all duration-300 ${
            stage === "enqueuing"
              ? "border-[#00FF66] bg-[#00FF66]/5 shadow-[0_0_25px_rgba(0,255,102,0.15)]"
              : "border-white/[0.08] bg-[#0E1219]/90"
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-3">
              <span className="text-zinc-400 uppercase tracking-wider text-[10px]">STEP 1: UNBLOCK AGENT</span>
              <span className="px-2 py-0.5 rounded bg-white/[0.05] text-zinc-300 text-[10px]">
                &lt; 10ms
              </span>
            </div>
            
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono">Agent Enqueues Task</h4>
                <span className="text-[11px] text-zinc-400 font-sans">Turn stays completely responsive</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-black/50 border border-white/[0.05] font-mono text-[11px] text-zinc-300 space-y-1">
              <div className="text-zinc-500">// Zero turn timeout:</div>
              <div className="text-emerald-400">await beastmq.enqueue(&#123;</div>
              <div className="pl-3 text-zinc-300">type: &apos;{selectedScenario.type}&apos;,</div>
              <div className="pl-3 text-zinc-300">role: &apos;{selectedScenario.role}&apos;</div>
              <div className="text-emerald-400">&#125;)</div>
            </div>
          </div>

          {/* STAGE 2: PostgreSQL ACID Storage */}
          <div className={`p-5 rounded-xl border transition-all duration-300 ${
            stage === "claimed"
              ? "border-[#00FF66] bg-[#00FF66]/5 shadow-[0_0_25px_rgba(0,255,102,0.15)]"
              : "border-white/[0.08] bg-[#0E1219]/90"
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-3">
              <span className="text-zinc-400 uppercase tracking-wider text-[10px]">STEP 2: POSTGRES LOCK</span>
              <span className="px-2 py-0.5 rounded bg-[#00FF66]/10 text-[#00FF66] text-[10px] font-bold">
                ZERO REDIS
              </span>
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono">Atomic SKIP LOCKED</h4>
                <span className="text-[11px] text-zinc-400 font-sans">No dual-writes, 10s lease heartbeats</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-black/50 border border-white/[0.05] font-mono text-[11px] text-zinc-300 space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Job ID:</span>
                <span className="text-white font-bold">{activeJobId}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Status:</span>
                <span className={stage === "completed" ? "text-[#00FF66]" : "text-yellow-400"}>
                  {stage === "completed" ? "completed" : stage === "claimed" ? "running" : "pending"}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Lease:</span>
                <span className="text-zinc-200">300s (Heartbeat OK)</span>
              </div>
            </div>
          </div>

          {/* STAGE 3: Background Worker Execution */}
          <div className={`p-5 rounded-xl border transition-all duration-300 ${
            stage === "completed"
              ? "border-[#00FF66] bg-[#00FF66]/5 shadow-[0_0_25px_rgba(0,255,102,0.15)]"
              : "border-white/[0.08] bg-[#0E1219]/90"
          }`}>
            <div className="flex items-center justify-between text-xs font-mono mb-3">
              <span className="text-zinc-400 uppercase tracking-wider text-[10px]">STEP 3: EXECUTE & PERSIST</span>
              <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[#00FF66] text-[10px] font-bold">
                ACID DURABLE
              </span>
            </div>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-lg bg-[#00FF66]/10 text-[#00FF66]">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-mono">Worker Saves Result</h4>
                <span className="text-[11px] text-zinc-400 font-sans">JSONB stored directly in DB</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-black/50 border border-white/[0.05] font-mono text-[11px] text-zinc-300 overflow-x-auto">
              <div className="text-zinc-500">// Result payload:</div>
              <pre className="text-emerald-300 text-[10px] leading-tight">
                {JSON.stringify(selectedScenario.output, null, 2)}
              </pre>
            </div>
          </div>

        </div>

        {/* Explanation callout for why this matters */}
        <div className="mt-5 p-3.5 rounded-xl bg-black/60 border border-white/[0.06] flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="text-[#00FF66] font-bold">WHY THIS MATTERS:</span>
            <span className="text-zinc-400 font-sans">{selectedScenario.why}</span>
          </div>
          <button
            onClick={() => runSimulation(selectedScenario)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#00FF66] text-black font-bold text-xs hover:bg-[#4EFE82] transition-colors shrink-0"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Re-run Test</span>
          </button>
        </div>
      </div>

    </div>
  );
}
