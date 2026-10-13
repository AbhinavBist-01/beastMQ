"use client";

import { useState } from "react";
import {
  Database,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Server,
  Terminal,
  Radio,
} from "lucide-react";

export function ArchitectureDiagram() {
  const [selectedNode, setSelectedNode] = useState<string>("broker");

  const nodeDetails: Record<
    string,
    { title: string; subtitle: string; desc: string; sql?: string }
  > = {
    producers: {
      title: "Event & Task Producers",
      subtitle: "Autonomous Agents, Webhook Ingest, API Endpoints",
      desc: "Services enqueue jobs directly via BeastMQClient (Drizzle ORM direct query) or over HTTP POST /jobs. Supports payload, priority, traceId, parentJobId, and idempotencyKey.",
      sql: "INSERT INTO jobs (type, payload, priority, trace_id, parent_job_id, idempotency_key) VALUES (...)",
    },
    broker: {
      title: "BeastMQ Core Engine (PostgreSQL)",
      subtitle: "ACID Row-Locks & Lease Watchdog",
      desc: "Zero Redis needed. Uses PostgreSQL's ACID storage with row-level locks. Heartbeats periodically refresh locked_until (default 300s). Distributed idempotency keys prevent duplicate execution.",
      sql: "SELECT * FROM jobs WHERE (status = 'pending' AND available_at <= NOW()) OR (status = 'running' AND locked_until < NOW()) ORDER BY priority DESC, created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;",
    },
    queues: {
      title: "Priority Queues & Agent Hierarchies",
      subtitle: "Priority-Ordered & Parent-Child Trees",
      desc: "Subtasks are linked by parentJobId and traceId. Supervisors can fan-out dozens of parallel subtasks and fan-in results when all child tasks reach completed or dead.",
      sql: "SELECT * FROM jobs WHERE parent_job_id = $1;",
    },
    consumers: {
      title: "Distributed Worker Fleet",
      subtitle: "WorkerRunner Fibers & Execution AbortSignals",
      desc: "Each worker runs concurrent fibers. Built-in handlers execute agent.command (with process kill signals) or agent.http, storing results directly into jobs.result jsonb column.",
      sql: "UPDATE jobs SET status = 'completed', result = $2, completed_at = NOW() WHERE id = $1;",
    },
    dlq: {
      title: "Dead Letter Queue (dead_jobs)",
      subtitle: "Exponential Backoff & Terminal Failure Storage",
      desc: "Jobs that fail are rescheduled with exponential delay (1s, 2s, 4s, 8s...). After 5 failed attempts, they are moved to dead_jobs with full error logs and can be replayed anytime via CLI or API.",
      sql: "INSERT INTO dead_jobs (job_id, type, payload, attempts, error) VALUES (...);",
    },
  };

  return (
    <section
      id="architecture"
      className="py-24 md:py-32 border-t border-white/[0.08] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-16 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            From event to execution.
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal">
            A resilient pipeline combining PostgreSQL row-level locks,
            distributed idempotency, and abort-safe execution fibers.
          </p>
        </div>

        {/* Horizontal Architecture Diagram Box */}
        <div className="p-6 sm:p-10 rounded-2xl border border-white/[0.08] bg-[#0A0D12] shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[880px] grid grid-cols-12 gap-4 items-center relative py-6">
              {/* STAGE 1: PRODUCERS (Cols 1-3) */}
              <button
                onClick={() => setSelectedNode("producers")}
                className={`col-span-3 text-left p-4 rounded-xl border transition-all ${
                  selectedNode === "producers"
                    ? "border-[#00FF66] bg-[#00FF66]/5 shadow-[0_0_20px_rgba(0,255,102,0.15)]"
                    : "border-white/[0.08] bg-[#0E1219]/80 hover:border-white/[0.2]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    STAGE 01
                  </span>
                  <Radio className="w-3.5 h-3.5 text-[#00FF66]" />
                </div>
                <div className="text-sm font-mono font-bold text-white mb-1">
                  1. Producers
                </div>
                <p className="text-xs text-zinc-400 font-sans">
                  AI Agents, Webhooks, CLI commands, HTTP clients
                </p>
                <div className="mt-3 text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
                  <span>directDB | POST /jobs</span>
                </div>
              </button>

              {/* Arrow 1 */}
              <div className="col-span-1 flex flex-col items-center justify-center text-zinc-600">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  ENQUEUE
                </span>
                <ArrowRight className="w-5 h-5 text-[#00FF66]/80 animate-pulse" />
              </div>

              {/* STAGE 2: BROKER (Cols 5-7) */}
              <button
                onClick={() => setSelectedNode("broker")}
                className={`col-span-3 text-left p-4 rounded-xl border transition-all ${
                  selectedNode === "broker"
                    ? "border-[#00FF66] bg-[#00FF66]/5 shadow-[0_0_20px_rgba(0,255,102,0.15)]"
                    : "border-white/[0.08] bg-[#0E1219]/80 hover:border-white/[0.2]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    STAGE 02
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-white mb-1 flex items-center gap-1.5">
                  <span>2. BeastMQ Broker</span>
                </div>
                <p className="text-xs text-zinc-400 font-sans">
                  PostgreSQL ACID engine with row locks & idempotency
                </p>
                <div className="mt-3 text-[10px] font-mono text-[#00FF66] flex items-center gap-1.5">
                  <Database className="w-3 h-3" />
                  <span>SKIP LOCKED</span>
                </div>
              </button>

              {/* Arrow 2 */}
              <div className="col-span-1 flex flex-col items-center justify-center text-zinc-600">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  CLAIM
                </span>
                <ArrowRight className="w-5 h-5 text-[#00FF66]/80 animate-pulse" />
              </div>

              {/* STAGE 3: CONSUMERS (Cols 9-12) */}
              <button
                onClick={() => setSelectedNode("consumers")}
                className={`col-span-4 text-left p-4 rounded-xl border transition-all ${
                  selectedNode === "consumers"
                    ? "border-[#00FF66] bg-[#00FF66]/5 shadow-[0_0_20px_rgba(0,255,102,0.15)]"
                    : "border-white/[0.08] bg-[#0E1219]/80 hover:border-white/[0.2]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    STAGE 03
                  </span>
                  <Server className="w-3.5 h-3.5 text-[#00FF66]" />
                </div>
                <div className="text-sm font-mono font-bold text-white mb-1">
                  3. Workers & Subagents
                </div>
                <p className="text-xs text-zinc-400 font-sans">
                  Concurrent fibers, shell abort signals, JSONB results
                </p>
                <div className="mt-3 text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
                  <span>10s Heartbeat Lease</span>
                </div>
              </button>
            </div>

            {/* DLQ and Retry Path Bottom Rail */}
            <div className="min-w-[880px] mt-4 pt-4 border-t border-dashed border-white/[0.08] flex items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                <RotateCcw className="w-4 h-4 text-yellow-400" />
                <span>
                  <strong className="text-zinc-200">Retry Path:</strong>{" "}
                  Exponential backoff delay (1s · 2s · 4s · 8s)
                </span>
              </div>

              <button
                onClick={() => setSelectedNode("dlq")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  selectedNode === "dlq"
                    ? "border-red-500 bg-red-950/40 text-red-300"
                    : "border-red-500/30 bg-red-950/10 text-red-400 hover:border-red-500/60"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Isolated DLQ: dead_jobs (Replay via API/CLI)</span>
              </button>
            </div>
          </div>

          {/* Inspection Drawer / Details Box */}
          <div className="mt-6 p-5 rounded-xl border border-white/[0.08] bg-black/60 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3 mb-3">
              <div>
                <span className="text-xs text-[#00FF66] font-bold block">
                  INSPECTED COMPONENT: {nodeDetails[selectedNode].title}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {nodeDetails[selectedNode].subtitle}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-zinc-400">
                Click any stage above to inspect
              </span>
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed mb-3">
              {nodeDetails[selectedNode].desc}
            </p>

            {nodeDetails[selectedNode].sql && (
              <div className="p-3 rounded bg-[#07090D] border border-white/[0.04] text-[11px] text-emerald-300 overflow-x-auto">
                <span className="text-zinc-500 select-none mr-2">SQL &gt;</span>
                <code>{nodeDetails[selectedNode].sql}</code>
              </div>
            )}
          </div>
        </div>

        {/* 3-Step Lifecycle Explanation */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="w-8 h-8 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-xs font-mono font-bold text-[#00FF66]">
              01
            </div>
            <h4 className="text-base font-mono font-bold text-white">
              Produce — Services publish events
            </h4>
            <p className="text-sm text-zinc-400 font-sans leading-relaxed">
              Applications or autonomous agents publish tasks with optional
              idempotency keys, priorities, and parent correlation IDs without
              needing a dedicated broker cluster.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="w-8 h-8 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-xs font-mono font-bold text-[#00FF66]">
              02
            </div>
            <h4 className="text-base font-mono font-bold text-white">
              Route — BeastMQ directs messages
            </h4>
            <p className="text-sm text-zinc-400 font-sans leading-relaxed">
              PostgreSQL handles locking and prioritization atomically. Active
              heartbeats extend leases, guaranteeing crash safety and preventing
              stale jobs from being abandoned.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="w-8 h-8 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-xs font-mono font-bold text-[#00FF66]">
              03
            </div>
            <h4 className="text-base font-mono font-bold text-white">
              Consume — Workers process asynchronously
            </h4>
            <p className="text-sm text-zinc-400 font-sans leading-relaxed">
              Worker fibers execute tasks with execution timeouts and abort
              signals. Structured outputs are persisted directly into the{" "}
              <code className="text-zinc-200">result</code> column for
              supervisor retrieval.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
