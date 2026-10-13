import React from "react";
import { Terminal3D } from "./Terminal3D";

export function DeveloperExperience() {
  return (
    <section id="developer-experience" className="py-24 md:py-32 border-t border-white/[0.08] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading - Clean typography, zero gradient slop, zero capsule pill */}
        <div className="max-w-3xl mb-14 space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
            Built for terminals. <br />
            <span className="text-zinc-400">Ready for autonomous agents.</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal">
            Every feature in BeastMQ is accessible through direct SQL, an idiomatic TypeScript SDK, or the unified <code className="text-zinc-200">npx beastmq</code> CLI.
          </p>
        </div>

        {/* 3D WebGL Terminal Experience */}
        <Terminal3D />

      </div>
    </section>
  );
}
