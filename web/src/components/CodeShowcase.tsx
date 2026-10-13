"use client";

import React, { useState } from "react";
import { Copy, Check, Play, Terminal, RefreshCw } from "lucide-react";

export function CodeShowcase() {
  const [activeTab, setActiveTab] = useState<"ts" | "agent" | "worker">("ts");
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "// Click 'Simulate Execution' to trace a live job lifecycle",
    "// BeastMQ runs directly on PostgreSQL (no Redis required)",
  ]);

  const codeSnippets = {
    ts: `import { BeastMQClient } from "beastmq";

// Operates directly on PostgreSQL or via HTTP REST
const client = new BeastMQClient({
  baseUrl: process.env.BEASTMQ_URL,
  apiKey: process.env.BEASTMQ_API_KEY,
  preferDirect: true, // Direct Drizzle ORM queries
});

// 1. Enqueue an agent task with idempotency & priority
const job = await client.enqueue({
  type: "agent.command",
  payload: {
    command: "npm run benchmark",
    cwd: "/workspace",
  },
  priority: 10,
  idempotencyKey: "bench_run_oct_12",
  agentRole: "performance_auditor",
});

console.log(\`Enqueued job: \${job.id}\`);

// 2. Await completion with turn-timeout shield
const result = await client.waitForJob(job.id, {
  timeoutMs: 60_000,
  pollIntervalMs: 500,
});

console.log("Execution output:", result.result);`,

    agent: `// Multi-Agent Hierarchical Fan-Out
import { BeastMQClient } from "beastmq";

const client = new BeastMQClient();

// Supervisor enqueues parent task
const parent = await client.enqueue({
  type: "supervisor.audit",
  payload: { repo: "org/core-engine" },
  role: "lead_architect",
});

// Fan-out 2 specialized subagent tasks
await client.spawnSubtask(parent.id, {
  type: "agent.command",
  payload: { command: "npm test" },
  agentRole: "test_runner",
});

await client.spawnSubtask(parent.id, {
  type: "agent.http",
  payload: { url: "https://api.github.com/repos/org/core-engine" },
  agentRole: "metadata_fetcher",
});

// Fan-in: Await all child subtasks simultaneously
const { subtasks, allCompleted } = await client.waitForSubtasks(parent.id);
console.log(\`Finished \${subtasks.length} subtasks:\`, allCompleted);`,

    worker: `import { WorkerRunner } from "beastmq";

// Initialize worker with concurrency fibers
const worker = new WorkerRunner({
  concurrency: 5,        // 5 concurrent fibers
  minPollDelayMs: 100,   // Rapid poll during active workloads
  maxPollDelayMs: 5000,  // Exponential backoff when idle
  jobTimeoutMs: 30000,   // AbortSignal triggered after 30s
  leaseDurationMs: 300000, // 5-minute lease with 10s heartbeat
});

// Mode A: Persistent worker daemon
await worker.start();

// Mode B: One-shot tool execution (drain until queue empty)
// const processedCount = await worker.drain();`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    const newLogs: string[] = [];
    const pushLog = (log: string) => {
      newLogs.push(log);
      setTerminalLogs([...newLogs]);
    };

    setTerminalLogs(["[00:00.00] Initializing BeastMQ client..."]);

    setTimeout(() => {
      pushLog(
        "[00:00.12] INSERT INTO jobs (type: 'agent.command', priority: 10) RETURNING id",
      );
      pushLog(
        "[00:00.15] Job enqueued: e93d4a12-88ef-4172-8821-39efc7882190 (pending)",
      );
    }, 400);

    setTimeout(() => {
      pushLog("[00:00.45] Worker fiber #3: SELECT ... FOR UPDATE SKIP LOCKED");
      pushLog(
        "[00:00.48] Atomic claim secured by worker-fiber-3 (lease: 300s)",
      );
    }, 1000);

    setTimeout(() => {
      pushLog("[00:01.10] Heartbeat renewal scheduled (interval: 10,000ms)");
      pushLog(
        "[00:01.85] Subprocess executed with AbortSignal watchdog active",
      );
    }, 1800);

    setTimeout(() => {
      pushLog(
        "[00:02.40] Command completed with exitCode: 0, duration: 1820ms",
      );
      pushLog(
        "[00:02.44] UPDATE jobs SET status='completed', result={exitCode: 0, durationMs: 1820}",
      );
      pushLog(
        "[00:02.50] Client resolved waitForJob() -> JSONB payload ready!",
      );
      setIsSimulating(false);
    }, 2800);
  };

  return (
    <section id="code" className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#00FF66] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
            DEVELOPER INTERFACE
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Less plumbing. <br />
            <span className="text-zinc-400">More building.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal">
            Whether using the TypeScript SDK or calling the CLI directly inside
            an agent tool call, BeastMQ keeps syntax concise and state fully
            transparent.
          </p>
        </div>

        {/* Code & Terminal Dual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Code Editor Panel (Cols 1-7) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-[#0A0D12] overflow-hidden flex flex-col shadow-[0_15px_50px_rgba(0,0,0,0.7)]">
            {/* Editor Header Bar */}
            <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-black/40 gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("ts")}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                    activeTab === "ts"
                      ? "bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  TypeScript SDK
                </button>
                <button
                  onClick={() => setActiveTab("agent")}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                    activeTab === "agent"
                      ? "bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Subagent Fan-Out
                </button>
                <button
                  onClick={() => setActiveTab("worker")}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                    activeTab === "worker"
                      ? "bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Worker Runner
                </button>
              </div>

              <button
                onClick={handleCopy}
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
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed text-zinc-300 overflow-x-auto flex-1 bg-[#06080B]/90">
              <pre>
                <code>{codeSnippets[activeTab]}</code>
              </pre>
            </div>

            {/* Editor Footer */}
            <div className="px-5 py-2.5 border-t border-white/[0.06] bg-black/40 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
              <span>SDK: zero-config direct Drizzle ORM fallback</span>
              <span className="text-[#00FF66]">ESM & CJS Compatible</span>
            </div>
          </div>

          {/* Right: Live Interactive Terminal (Cols 8-12) */}
          <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#0A0D12] overflow-hidden flex flex-col shadow-[0_15px_50px_rgba(0,0,0,0.7)]">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-black/40">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00FF66]" />
                <span className="text-xs font-mono text-zinc-300 font-semibold">
                  Queue Execution Stream
                </span>
              </div>
              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#00FF66] hover:bg-[#4EFE82] text-black font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,255,102,0.25)] active:scale-95 disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Simulate Run</span>
                  </>
                )}
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-4 sm:p-5 font-mono text-xs text-zinc-300 flex-1 space-y-2 overflow-y-auto max-h-[460px] bg-black/70">
              <div className="text-[11px] text-zinc-500 pb-2 border-b border-white/[0.05]">
                $ beastmq-worker-cluster :: fiber pool concurrency: 5
              </div>
              {terminalLogs.map((log, index) => {
                const isError = log.includes("Error");
                const isSuccess =
                  log.includes("completed") || log.includes("resolved");
                const isSql =
                  log.includes("SELECT") ||
                  log.includes("INSERT") ||
                  log.includes("UPDATE");
                return (
                  <div
                    key={index}
                    className={`leading-relaxed text-[11px] sm:text-xs transition-opacity ${
                      isError
                        ? "text-red-400"
                        : isSuccess
                          ? "text-[#00FF66] font-semibold"
                          : isSql
                            ? "text-cyan-300"
                            : log.startsWith("//")
                              ? "text-zinc-500 italic"
                              : "text-zinc-300"
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>

            {/* Terminal Footer Indicator */}
            <div className="px-4 py-2.5 border-t border-white/[0.06] bg-black/50 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
                Queue state: Ready
              </span>
              <span className="text-zinc-500">PostgreSQL ACID WAL</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
