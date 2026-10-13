"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check, Cpu, ShieldCheck, ArrowRight, Zap } from "lucide-react";

export function SkillsEcosystem() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"toolcall" | "drain">("toolcall");

  const skillCommand = "npx skills add AbhinavBist-01/beastmq";

  const handleCopy = () => {
    navigator.clipboard.writeText(skillCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 md:py-28 border-t border-white/[0.08] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[350px] bg-[#00FF66]/[0.05] blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Give your AI agents <br />
            <span className="text-zinc-400">
              infinite execution stamina.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal leading-relaxed">
            When coding agents run slow commands (&gt;15s), their turns crash. BeastMQ acts as an autonomous background shield through the open <strong className="text-white">skills.sh</strong> standard.
          </p>
        </div>

        {/* Main Grid: Interactive Agent Tool Call Simulator + Capabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Real Agent Tool-Call Trace (Cols 1-7) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/[0.1] bg-[#0A0D12] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header Tabs */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-black/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00FF66]" />
                <span className="text-xs font-mono font-bold text-white">
                  Agent Turn Telemetry Stream
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setActiveTab("toolcall")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeTab === "toolcall"
                      ? "bg-[#00FF66]/15 text-[#00FF66] font-bold border border-[#00FF66]/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Autonomous Tool Call
                </button>
                <button
                  onClick={() => setActiveTab("drain")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeTab === "drain"
                      ? "bg-[#00FF66]/15 text-[#00FF66] font-bold border border-[#00FF66]/30"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Worker --drain Mode
                </button>
              </div>
            </div>

            {/* Simulated Agent Code / Dialogue */}
            <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-300 bg-[#07090D] flex-1 overflow-x-auto space-y-3">
              {activeTab === "toolcall" ? (
                <>
                  <div className="text-zinc-500">// 1. User prompts the agent in Claude Code or Cursor:</div>
                  <div className="text-zinc-200 bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                    <strong className="text-[#00FF66]">User:</strong> &quot;Audit the codebase, run test suites, and benchmark performance.&quot;
                  </div>

                  <div className="text-zinc-500">// 2. Agent recognizes heavy 25s task and offloads via BeastMQ skill:</div>
                  <div className="text-emerald-300 bg-black/60 p-3 rounded-lg border border-[#00FF66]/20">
                    <span className="text-yellow-400 block mb-1">⚡ agent_tool_call: beastmq.enqueue</span>
                    &#123;<br />
                    &nbsp;&nbsp;&quot;type&quot;: &quot;agent.command&quot;,<br />
                    &nbsp;&nbsp;&quot;payload&quot;: &#123; &quot;command&quot;: &quot;npm run test:audit&quot; &#125;,<br />
                    &nbsp;&nbsp;&quot;agentRole&quot;: &quot;security_auditor&quot;,<br />
                    &nbsp;&nbsp;&quot;priority&quot;: 10<br />
                    &#125;
                  </div>

                  <div className="text-zinc-500">// 3. BeastMQ responds in &lt;4ms. Turn unblocked immediately:</div>
                  <div className="text-[#00FF66] font-semibold">
                    ✓ Job enqueued into PostgreSQL: a81f9b02-44df-4192 (status: pending)
                  </div>
                  <div className="text-zinc-400 text-[11px]">
                    Result: Worker executes in background. LLM turn completes with ZERO timeout!
                  </div>
                </>
              ) : (
                <>
                  <div className="text-zinc-500">// One-shot execution: Agent processes queue and exits cleanly:</div>
                  <div className="text-emerald-400 font-bold">$ npx beastmq worker --drain</div>
                  <div className="text-zinc-300">
                    ⚡ beastMQ Worker [drain-mode] started.<br />
                    Worker 7f83a210 concurrency: 5 fibers<br />
                    Claimed job a81f9b02 via FOR UPDATE SKIP LOCKED<br />
                    Heartbeat active (10s interval, 300s lease)<br />
                    Subprocess finished with exitCode: 0, duration: 2410ms<br />
                    Result saved to jobs.result.<br />
                    Queue empty. Drained 1 total job(s). Clean exit 0.
                  </div>
                </>
              )}
            </div>

            {/* Bottom Status Indicator */}
            <div className="px-5 py-2.5 border-t border-white/[0.06] bg-black/50 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span>skills.sh Certification: VERIFIED</span>
              <span className="text-[#00FF66] font-bold">100% NON-BLOCKING</span>
            </div>
          </div>

          {/* Right: Why Skills.sh Matters Cards (Cols 8-12) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0D1016]/80 space-y-2">
              <div className="flex items-center gap-2 text-[#00FF66] font-mono text-xs font-bold">
                <Zap className="w-4 h-4" />
                <span>Turn-Timeout Shield</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Prevents the classic 15-second tool timeout crash. The agent offloads work to BeastMQ and retrieves outputs when ready.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0D1016]/80 space-y-2">
              <div className="flex items-center gap-2 text-[#00FF66] font-mono text-xs font-bold">
                <Cpu className="w-4 h-4" />
                <span>Multi-Subagent Fan-Out</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Supervisor agents can spawn 10 subagent tasks in parallel with linked <code className="text-white">parentJobId</code> and <code className="text-white">traceId</code>, then fan-in results.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.08] bg-[#0D1016]/80 space-y-2">
              <div className="flex items-center gap-2 text-[#00FF66] font-mono text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Infrastructure Setup</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Runs directly on your PostgreSQL database. No Redis servers to configure, no external queue subscriptions, and no cloud bills.
              </p>
            </div>

            {/* Big Install Banner */}
            <div className="p-4 rounded-xl border border-[#00FF66]/30 bg-[#00FF66]/5 shadow-[0_0_25px_rgba(0,255,102,0.1)] flex items-center justify-between gap-3">
              <div className="font-mono text-xs">
                <span className="text-zinc-400 block text-[10px]">INSTALL SKILL:</span>
                <span className="text-white font-bold">{skillCommand}</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-md bg-[#00FF66] hover:bg-[#4EFE82] text-black font-mono font-bold text-xs transition-all shadow-[0_0_15px_rgba(0,255,102,0.3)] active:scale-95 shrink-0"
              >
                {copied ? "COPIED!" : "COPY"}
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
