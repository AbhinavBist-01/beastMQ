import React from "react";
import { Zap, ShieldCheck, Layers, Terminal } from "lucide-react";

export function MetricsStrip() {
  const metrics = [
    {
      icon: Zap,
      value: "15k+ ops/s",
      badge: "Simulated bench",
      label: "Message Throughput",
      detail: "Row-locked batch claims via SKIP LOCKED without dual-write hazards.",
    },
    {
      icon: ShieldCheck,
      value: "100% ACID",
      badge: "Strict Durability",
      label: "Delivery Reliability",
      detail: "WAL-backed PostgreSQL tables. Zero RAM volatility or eviction risk.",
    },
    {
      icon: Layers,
      value: "Fiber Pools",
      badge: "Auto-Recovering",
      label: "Horizontal Scaling",
      detail: "Configurable worker concurrency with 10s lease heartbeats.",
    },
    {
      icon: Terminal,
      value: "Zero Redis",
      badge: "Minimal Ops",
      label: "Developer Experience",
      detail: "Runs directly on your existing Postgres DB. Instant CLI & SDK.",
    },
  ];

  return (
    <div className="border-y border-white/[0.08] bg-[#0A0D12]/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="relative p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-1.5 rounded-md bg-[#00FF66]/10 text-[#00FF66]">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                    {m.badge}
                  </span>
                </div>

                <div className="text-2xl font-mono font-extrabold text-white tracking-tight group-hover:text-[#00FF66] transition-colors">
                  {m.value}
                </div>

                <div className="text-xs font-semibold text-zinc-300 mt-0.5 font-sans">
                  {m.label}
                </div>

                <p className="text-[11px] text-zinc-500 font-mono mt-1.5 leading-relaxed">
                  {m.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
