"use client";

import React, { useState, useEffect } from "react";
import { BeastLogo } from "./BeastLogo";
import { Activity, Cpu, Database, Server, Zap, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";

interface Packet {
  id: number;
  source: number; // 0, 1, 2
  target: number; // 0, 1, 2, 3
  progress: number;
  color: string;
}

export function MessageFlowVisualization() {
  const [throughput, setThroughput] = useState(14820);
  const [latency, setLatency] = useState(3.8);
  const [totalProcessed, setTotalProcessed] = useState(128490);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [activeTab, setActiveTab] = useState<"stream" | "inspect">("stream");
  const [burstActive, setBurstActive] = useState(false);

  // Animate throughput ticker slightly to look authentic
  useEffect(() => {
    const interval = setInterval(() => {
      setThroughput((prev) => {
        const delta = Math.floor(Math.random() * 41) - 20;
        return Math.max(13500, Math.min(15800, prev + delta));
      });
      setLatency((prev) => +(prev + (Math.random() * 0.4 - 0.2)).toFixed(1));
      setTotalProcessed((prev) => prev + Math.floor(Math.random() * 25) + 10);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // Animate message packets moving along the grid
  useEffect(() => {
    const packetTimer = setInterval(() => {
      setPackets((current) => {
        // Advance existing packets
        const advanced = current
          .map((p) => ({ ...p, progress: p.progress + 0.04 }))
          .filter((p) => p.progress <= 1);

        // Spawn new packet randomly
        if (Math.random() > 0.35 && advanced.length < 8) {
          advanced.push({
            id: Date.now() + Math.random(),
            source: Math.floor(Math.random() * 3),
            target: Math.floor(Math.random() * 4),
            progress: 0,
            color: Math.random() > 0.9 ? "#EF4444" : "#00FF66",
          });
        }
        return advanced;
      });
    }, 40);

    return () => clearInterval(packetTimer);
  }, []);

  const triggerBurst = () => {
    setBurstActive(true);
    setThroughput(24190);
    setPackets((prev) => [
      ...prev,
      { id: Math.random(), source: 0, target: 0, progress: 0.05, color: "#00FF66" },
      { id: Math.random(), source: 1, target: 1, progress: 0.1, color: "#00FF66" },
      { id: Math.random(), source: 2, target: 2, progress: 0.15, color: "#00FF66" },
      { id: Math.random(), source: 0, target: 3, progress: 0.2, color: "#00FF66" },
    ]);
    setTimeout(() => {
      setBurstActive(false);
    }, 1500);
  };

  return (
    <div className="relative w-full rounded-2xl border border-white/[0.08] bg-[#0A0D12]/90 backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/[0.06] bg-black/30 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]/80" />
          </div>
          <span className="text-xs font-mono font-medium text-zinc-400">
            beastmq-cluster-mesh :: topology: <span className="text-zinc-200">postgres-skip-locked</span>
          </span>
        </div>

        {/* Live Metrics Counters */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66]">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-bold">{throughput.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-400">ops/s [simulated]</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <span>Latency:</span>
            <span className="text-zinc-200">{latency}ms</span>
          </div>
          <button
            onClick={triggerBurst}
            disabled={burstActive}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-zinc-300 hover:text-white transition-all text-[11px] active:scale-95"
            title="Inject test burst"
          >
            <Zap className={`w-3 h-3 ${burstActive ? "text-[#00FF66]" : "text-yellow-400"}`} />
            <span>{burstActive ? "Bursting..." : "Simulate Burst"}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Diagram Canvas */}
      <div className="relative p-6 sm:p-10 min-h-[380px] flex items-center justify-center bg-grid-pattern overflow-x-auto">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#00FF66]/10 blur-[100px] pointer-events-none" />

        <div className="min-w-[680px] w-full max-w-4xl grid grid-cols-12 items-center gap-4 sm:gap-6 relative z-10">
          
          {/* COLUMN 1: PRODUCERS (Left, cols 1-3) */}
          <div className="col-span-3 space-y-3.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Event Producers
            </div>

            {/* Producer Node 1 */}
            <div className="group p-3 rounded-lg border border-white/[0.08] bg-[#0E1219]/80 hover:border-white/[0.2] transition-all">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-zinc-200 font-semibold">agent.command</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400">SHELL</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">Offloads CLI turn-timeout</p>
            </div>

            {/* Producer Node 2 */}
            <div className="group p-3 rounded-lg border border-white/[0.08] bg-[#0E1219]/80 hover:border-white/[0.2] transition-all">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-zinc-200 font-semibold">agent.http</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400">FETCH</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">Async scraping & webhooks</p>
            </div>

            {/* Producer Node 3 */}
            <div className="group p-3 rounded-lg border border-white/[0.08] bg-[#0E1219]/80 hover:border-white/[0.2] transition-all">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-zinc-200 font-semibold">Supervisor LLM</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00FF66]/10 text-[#00FF66]">FAN-OUT</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">Parent job + traceId</p>
            </div>
          </div>

          {/* SVG Connection Lines Left -> Center */}
          <div className="col-span-1 h-44 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 160" preserveAspectRatio="none">
              <line x1="0" y1="20" x2="100" y2="80" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="100" y2="80" stroke="#00FF66" strokeWidth="2" strokeOpacity="0.8" />
              <line x1="0" y1="140" x2="100" y2="80" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Animated Packets Moving In */}
              {packets.filter((p) => p.progress <= 0.5).map((p) => {
                const prog = p.progress * 2;
                const startY = p.source === 0 ? 20 : p.source === 1 ? 80 : 140;
                const currentY = startY + (80 - startY) * prog;
                return (
                  <circle
                    key={p.id}
                    cx={prog * 100}
                    cy={currentY}
                    r="4"
                    fill={p.color}
                    className="drop-shadow-[0_0_8px_#00FF66]"
                  />
                );
              })}
            </svg>
          </div>

          {/* COLUMN 2: CENTRAL BEASTMQ BROKER (Center, cols 5-8) */}
          <div className="col-span-4 relative group">
            {/* Glowing Border Card */}
            <div className="relative p-5 sm:p-6 rounded-2xl border-2 border-[#00FF66]/50 bg-gradient-to-b from-[#0F1722] to-[#0A0D14] shadow-[0_0_50px_rgba(0,255,102,0.15)] text-center">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#00FF66]/30 bg-[#00FF66]/10 text-[10px] font-mono text-[#00FF66] mb-3">
                <Database className="w-3 h-3" />
                <span>POSTGRESQL SKIP LOCKED</span>
              </div>

              {/* Central Geometric Beast Icon */}
              <div className="flex justify-center mb-3">
                <div className="p-3.5 rounded-xl border border-[#00FF66]/40 bg-[#08090B] shadow-[0_0_30px_rgba(0,255,102,0.25)]">
                  <BeastLogo size={42} glow={true} />
                </div>
              </div>

              <h3 className="text-base font-mono font-bold text-white tracking-wider">
                BeastMQ Engine
              </h3>
              <p className="text-[11px] font-mono text-zinc-400 mt-1">
                Zero Redis · Heartbeat Lease · Strict Durability
              </p>

              {/* State Pills */}
              <div className="mt-4 pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.05] text-left">
                  <span className="text-zinc-500 block">Queue Mode</span>
                  <span className="text-[#00FF66] font-semibold">Priority + Fifo</span>
                </div>
                <div className="p-1.5 rounded bg-white/[0.03] border border-white/[0.05] text-left">
                  <span className="text-zinc-500 block">Idempotency</span>
                  <span className="text-emerald-400 font-semibold">Key-Locked</span>
                </div>
              </div>
            </div>
          </div>

          {/* SVG Connection Lines Center -> Right */}
          <div className="col-span-1 h-44 relative flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 160" preserveAspectRatio="none">
              <line x1="0" y1="80" x2="100" y2="15" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="100" y2="60" stroke="#00FF66" strokeWidth="2" strokeOpacity="0.8" />
              <line x1="0" y1="80" x2="100" y2="105" stroke="#00FF66" strokeWidth="2" strokeOpacity="0.8" />
              <line x1="0" y1="80" x2="100" y2="150" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.5" />

              {/* Animated Packets Moving Out to Consumers */}
              {packets.filter((p) => p.progress > 0.5).map((p) => {
                const prog = (p.progress - 0.5) * 2;
                const endY = p.target === 0 ? 15 : p.target === 1 ? 60 : p.target === 2 ? 105 : 150;
                const currentY = 80 + (endY - 80) * prog;
                return (
                  <circle
                    key={p.id}
                    cx={prog * 100}
                    cy={currentY}
                    r="4"
                    fill={p.color}
                    className="drop-shadow-[0_0_8px_#00FF66]"
                  />
                );
              })}
            </svg>
          </div>

          {/* COLUMN 3: CONSUMERS & WORKERS (Right, cols 10-12) */}
          <div className="col-span-3 space-y-2.5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
              Worker Pool & DLQ
            </div>

            {/* Consumer 1 */}
            <div className="p-2.5 rounded-lg border border-white/[0.08] bg-[#0E1219]/80 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-200">Worker Fiber #1</span>
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              </div>
              <span className="text-[10px] text-zinc-500">Lease: active (heartbeat)</span>
            </div>

            {/* Consumer 2 */}
            <div className="p-2.5 rounded-lg border border-white/[0.08] bg-[#0E1219]/80 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-200">Worker Fiber #2</span>
                <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
              </div>
              <span className="text-[10px] text-zinc-500">Executing shell task</span>
            </div>

            {/* Consumer 3: Subagent */}
            <div className="p-2.5 rounded-lg border border-white/[0.08] bg-[#0E1219]/80 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-200">Subagent Fan-In</span>
                <span className="text-[10px] text-[#00FF66]">COMPLETED</span>
              </div>
              <span className="text-[10px] text-zinc-500">Saved to jobs.result</span>
            </div>

            {/* DLQ node */}
            <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-950/20 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>dead_jobs DLQ</span>
                </span>
                <span className="text-[10px] text-zinc-500">Replayable</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="px-6 py-3 border-t border-white/[0.06] bg-black/40 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-[#00FF66]" />
            Crash-Proof: Worker death releases lease automatically
          </span>
          <span className="hidden md:inline text-zinc-600">|</span>
          <span className="hidden md:inline text-zinc-400">
            Processed: <strong className="text-white">{totalProcessed.toLocaleString()}</strong> events
          </span>
        </div>
        <div className="text-[11px] text-zinc-500">
          Simulation running on PostgreSQL engine abstraction
        </div>
      </div>
    </div>
  );
}
