"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Activity, Database, ShieldCheck } from "lucide-react";

export function Hero3DStream() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({
    ops: 15420,
    latency: 3.8,
    activeWorkers: 5,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090b, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 2, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // 2. Central Core (BeastMQ Broker)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Inner dark obsidian core
    const coreGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0a1015,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x00ff66,
      emissiveIntensity: 0.1,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Outer glowing wireframe cage
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(coreGeo, wireMat);
    wireMesh.scale.set(1.15, 1.15, 1.15);
    coreGroup.add(wireMesh);

    // Core point lights (Electric green glow)
    const coreLight = new THREE.PointLight(0x00ff66, 3, 20);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4efe82, 1.5);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    // 3. Curved Stream Paths (Left Producer -> Center Core -> Right Worker)
    const curvePointsLeft: THREE.Vector3[][] = [
      [
        new THREE.Vector3(-14, 3, 0),
        new THREE.Vector3(-7, 2, 2),
        new THREE.Vector3(0, 0, 0),
      ],
      [
        new THREE.Vector3(-14, 0, -2),
        new THREE.Vector3(-6, 0, 1),
        new THREE.Vector3(0, 0, 0),
      ],
      [
        new THREE.Vector3(-14, -3, 1),
        new THREE.Vector3(-7, -2, -1),
        new THREE.Vector3(0, 0, 0),
      ],
    ];

    const curvePointsRight: THREE.Vector3[][] = [
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(7, 3, 2),
        new THREE.Vector3(14, 4, 0),
      ],
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(6, 1, -1),
        new THREE.Vector3(14, 1, -2),
      ],
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(7, -2, 1),
        new THREE.Vector3(14, -2, 1),
      ],
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(8, -4, -2),
        new THREE.Vector3(14, -5, 0),
      ],
    ];

    // Render guide tube lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0.2,
    });

    [...curvePointsLeft, ...curvePointsRight].forEach((pts) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const points = curve.getPoints(40);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geom, lineMat);
      scene.add(line);
    });

    // 4. Particle Streams traveling along curves
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const leftCurves = curvePointsLeft.map(
      (pts) => new THREE.CatmullRomCurve3(pts),
    );
    const rightCurves = curvePointsRight.map(
      (pts) => new THREE.CatmullRomCurve3(pts),
    );
    const allCurves = [...leftCurves, ...rightCurves];

    const particleProgress: { curveIdx: number; t: number; speed: number }[] =
      [];

    for (let i = 0; i < particleCount; i++) {
      const curveIdx = Math.floor(Math.random() * allCurves.length);
      const t = Math.random();
      const speed = 0.003 + Math.random() * 0.005;
      particleProgress.push({ curveIdx, t, speed });

      const pt = allCurves[curveIdx]!.getPoint(t);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;

      // Electric green & white accents
      const isLead = Math.random() > 0.85;
      colors[i * 3] = isLead ? 1 : 0;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = isLead ? 0.8 : 0.4;
    }

    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 5. Interactive Mouse Parallax
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 3;
      targetY = -y * 2;
    };

    window.addEventListener("mousemove", onMouseMove);

    // 6. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Smooth camera damping
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      camera.position.x = mouseX * 2;
      camera.position.y = 2 + mouseY * 1.5;
      camera.lookAt(0, 0, 0);

      // Rotate central broker core
      coreMesh.rotation.y += 0.3 * delta;
      coreMesh.rotation.x += 0.15 * delta;
      wireMesh.rotation.y -= 0.4 * delta;
      wireMesh.rotation.z += 0.2 * delta;

      // Pulse core light
      coreLight.intensity = 2.5 + Math.sin(clock.getElapsedTime() * 4) * 0.8;

      // Advance particles along curves
      const posAttr = particleGeo.getAttribute(
        "position",
      ) as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const p = particleProgress[i]!;
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.curveIdx = Math.floor(Math.random() * allCurves.length);
        }

        const point = allCurves[p.curveIdx]!.getPoint(p.t);
        posArr[i * 3] = point.x + (Math.random() - 0.5) * 0.2;
        posArr[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.2;
        posArr[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.2;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    // Live Metrics Ticker
    const ticker = setInterval(() => {
      setMetrics((prev) => ({
        ops: Math.floor(15000 + Math.random() * 800),
        latency: +(3.6 + Math.random() * 0.5).toFixed(1),
        activeWorkers: 5,
      }));
    }, 1500);

    return () => {
      clearInterval(ticker);
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl border border-white/[0.08] bg-[#0A0D12]/90 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.85)] overflow-hidden">
      {/* Top Telemetry Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-black/40 gap-3 z-20 relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]/70" />
          </div>
          <span className="text-xs font-mono font-medium text-zinc-300">
            3D Distributed Mesh ::{" "}
            <span className="text-[#00FF66]">PostgreSQL SKIP LOCKED</span>
          </span>
        </div>

        {/* Telemetry Pills */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66]">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-bold">{metrics.ops.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-400">ops/s</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-300">
            <span>Latency:</span>
            <span className="text-[#00FF66] font-bold">
              {metrics.latency}ms
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-300">
            <span>Fibers:</span>
            <span className="text-zinc-100 font-bold">
              {metrics.activeWorkers} concurrent
            </span>
          </div>
        </div>
      </div>

      {/* WebGL 3D Canvas Container */}
      <div className="relative w-full h-[420px] sm:h-[480px] bg-grid-pattern overflow-hidden">
        {/* Three.js canvas mount point */}
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Overlay Glass Badges (Floating in 3D Space) */}

        {/* Left Badge: Producers */}
        <div className="absolute top-6 left-6 pointer-events-none hidden sm:block">
          <div className="p-3.5 rounded-xl border border-white/[0.1] bg-[#0E1219]/80 backdrop-blur-md shadow-xl text-xs font-mono space-y-1.5 max-w-[200px]">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
              Event Producers
            </div>
            <div className="text-white font-bold">AI Coding Agents</div>
            <p className="text-[10px] text-zinc-400 font-sans leading-tight">
              Claude Code, Cursor, Antigravity offload &gt;15s commands
              instantly
            </p>
          </div>
        </div>

        {/* Center Badge: BeastMQ Engine Core */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="px-4 py-2 rounded-xl border border-[#00FF66]/30 bg-[#0A0D12]/90 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,102,0.15)] flex items-center gap-3 text-xs font-mono">
            <Database className="w-4 h-4 text-[#00FF66]" />

            <span className="text-zinc-500 text-[10px]">Zero Redis</span>
          </div>
        </div>

        {/* Right Badge: Distributed Workers */}
        <div className="absolute top-6 right-6 pointer-events-none hidden sm:block">
          <div className="p-3.5 rounded-xl border border-white/[0.1] bg-[#0E1219]/80 backdrop-blur-md shadow-xl text-xs font-mono space-y-1.5 max-w-[200px] text-right">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center justify-end gap-1.5">
              <span>Worker Fibers</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" />
            </div>
            <div className="text-white font-bold">10s Lease Heartbeats</div>
            <p className="text-[10px] text-zinc-400 font-sans leading-tight">
              Automatic crash recovery &amp; AbortSignals protect your system
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info Rail */}
      <div className="px-6 py-3 border-t border-white/[0.06] bg-black/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-400">
        <span className="flex items-center gap-2 text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-[#00FF66]" />
          Interactive 3D Canvas — Move cursor to orbit and inspect event stream
        </span>
        <span className="text-[11px] text-zinc-500">
          WebGL 60 FPS · Hardware Accelerated
        </span>
      </div>
    </div>
  );
}
