"use client";

import React, { useState } from "react";
import { Terminal, Copy, Check, Play, CheckCircle2, AlertTriangle, ArrowRight, Layers } from "lucide-react";

export function DeveloperExperience() {
  const [selectedCmd, setSelectedCmd] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const workflows = [
    {
      label: "worker --drain",
      title: "One-Shot Queue Draining",
      badge: "IMPLEMENTED IN CLI",
      desc: "Perfect for AI agent tool calls: processes all queued tasks to completion and exits cleanly without lingering background daemons.",
      command: "npx beastmq worker --drain",
      output: `⚡ beastMQ Worker [drain-mode] started.
Worker 7f83a210-9b4e-48a1 concurrency: 5
Processing job with ID: 4a2b9e11-88fc-4271-9128-49ba7c8021da (agent.command)
Heartbeat active (10s interval, 300s lease)
Job with ID: 4a2b9e11-88fc-4271-9128-49ba7c8021da completed successfully.
Queue empty. Drained 1 total job(s) in 2,410ms.
Worker stopped cleanly. Exit code 0.`,
    },
    {
      label: "status <id>",
      title: "Inspect Job Status & Result",
      badge: "IMPLEMENTED IN CLI",
      desc: "Retrieve granular execution timestamps, worker lease IDs, retry attempts, and the structured JSONB result payload.",
      command: "npx beastmq status 4a2b9e11-88fc-4271-9128-49ba7c8021da",
      output: `{
  "id": "4a2b9e11-88fc-4271-9128-49ba7c8021da",
  "type": "agent.command",
  "status": "completed",
  "priority": 10,
  "attempts": 1,
  "agentRole": "builder",
  "startedAt": "2026-10-12T18:14:20.112Z",
  "completedAt": "2026-10-12T18:14:22.522Z",
  "result": {
    "exitCode": 0,
    "stdout": "✓ Compiled in 2.4s\\n✓ Static assets generated",
    "stderr": "",
    "durationMs": 2410
  }
}`,
    },
    {
      label: "trace <traceId>",
      title: "Multi-Agent Session Tracing",
      badge: "IMPLEMENTED IN CLI",
      desc: "Inspect supervisor and child subagent task hierarchies across a unified traceId correlation session.",
      command: "npx beastmq trace session_deploy_99",
      output: `⚡ Trace: session_deploy_99 (3 linked jobs)
--------------------------------------------------------------------------------
[PARENT]    9b12a8... supervisor.deploy      status: completed  role: supervisor
  └── [SUBTASK] 4a2b9e... agent.command        status: completed  role: test_runner
  └── [SUBTASK] 8c33f1... agent.http           status: completed  role: webhook_notifier
All 3 jobs completed successfully. Zero timeouts.`,
    },
    {
      label: "dlq replay",
      title: "Dead Letter Queue Recovery",
      badge: "IMPLEMENTED IN CLI",
      desc: "Instantly resurrect permanently failed jobs from the dead_jobs archive table back into the active pending queue.",
      command: "npx beastmq dlq replay dead_81fa9902",
      output: `Fetching dead job record: dead_81fa9902
Error logged: "Connection timeout to payment gateway after 5 attempts"
✓ Replayed dead job into active queue.
New pending Job ID: e128b9aa-7719-482a-bc81-817290aa2102
Archived DLQ record removed.`,
    },
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developer-experience" className="py-24 md:py-32 border-t border-white/[0.08] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-14 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Built for terminals. <br />
            <span className="text-zinc-400">Ready for autonomous agents.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal">
            Every feature in BeastMQ is accessible through direct SQL, an idiomatic TypeScript SDK, or the unified <code className="text-zinc-200">npx beastmq</code> CLI.
          </p>
        </div>

        {/* Interactive CLI Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Workflow Selector Tabs (Cols 1-4) */}
          <div className="lg:col-span-4 space-y-3">
            {workflows.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCmd(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedCmd === idx
                    ? "border-[#00FF66]/50 bg-[#00FF66]/5 shadow-[0_0_20px_rgba(0,255,102,0.1)]"
                    : "border-white/[0.06] bg-[#0A0D12]/60 hover:border-white/[0.15] hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-white">
                    $ beastmq {item.label}
                  </span>
                  <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded border border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66]">
                    {item.badge}
                  </span>
                </div>
                <div className="text-xs font-medium text-zinc-300 font-sans mb-1">
                  {item.title}
                </div>
                <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                  {item.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Right Column: Simulated Terminal Screen (Cols 5-12) */}
          <div className="lg:col-span-8 rounded-2xl border border-white/[0.08] bg-[#0A0D12] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-black/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]/70" />
                <span className="text-xs font-mono text-zinc-400 ml-2">
                  bash — 80x24
                </span>
              </div>

              <button
                onClick={() => handleCopy(workflows[selectedCmd].command)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/[0.1] bg-white/[0.03] text-zinc-400 hover:text-white hover:border-white/[0.2] transition-all text-xs font-mono"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#00FF66]" />
                    <span className="text-[#00FF66]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>

            {/* Terminal Screen Body */}
            <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-300 bg-[#07090D] overflow-x-auto min-h-[360px]">
              {/* Prompt line */}
              <div className="flex items-center gap-2 text-zinc-400 mb-3 pb-2 border-b border-white/[0.05]">
                <span className="text-[#00FF66] font-bold">developer@workspace:~$</span>
                <span className="text-white font-semibold">{workflows[selectedCmd].command}</span>
              </div>

              {/* Command Output */}
              <pre className="text-zinc-300 whitespace-pre font-mono text-xs sm:text-[13px]">
                {workflows[selectedCmd].output}
              </pre>
            </div>

            {/* Terminal Footer */}
            <div className="px-5 py-2.5 border-t border-white/[0.06] bg-black/40 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
              <span>Status: Exited cleanly (Code 0)</span>
              <span className="text-[#00FF66] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validated against test suite
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
