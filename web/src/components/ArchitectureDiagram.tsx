import React from "react";
import { Architecture3D } from "./Architecture3D";

export function ArchitectureDiagram() {
  return (
    <section
      id="architecture"
      className="py-24 md:py-32 border-t border-white/[0.08] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading - Clean typography, zero gradient slop, zero capsule pill */}
        <div className="max-w-3xl mb-14 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            From event to execution. <br />
            <span className="text-zinc-400">Guaranteed in under 10ms.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal">
            A resilient pipeline combining PostgreSQL row-level locks,
            distributed idempotency, and abort-safe execution fibers.
          </p>
        </div>

        {/* Interactive 3D Architecture Canvas */}
        <Architecture3D />

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
