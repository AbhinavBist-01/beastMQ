"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Database,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  Server,
  Terminal,
  Radio,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";

interface StageInfo {
  id: string;
  name: string;
  badge: string;
  metric: string;
  title: string;
  subtitle: string;
  desc: string;
  sql: string;
  color: string;
}

export function Architecture3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState<string>("broker");
  const [pipelineMetrics, setPipelineMetrics] = useState({
    enqueued: 12480,
    lockedMs: 1.4,
    workersActive: 8,
    dlqRecoveries: 0,
  });

  const stages: Record<string, StageInfo> = {
    producers: {
      id: "producers",
      name: "1. Producers",
      badge: "INGESTION GATE",
      metric: "< 2ms Ack",
      title: "Event & Task Producers",
      subtitle: "Autonomous Agents, Webhooks, CLI Tools",
      desc: "Coding agents (Claude Code, Cursor, Antigravity) offload long-running builds, scrapers, and subagent tasks instantly via BeastMQClient (Drizzle direct query) or HTTP POST /jobs.",
      sql: "INSERT INTO jobs (type, payload, priority, trace_id, parent_job_id, idempotency_key) VALUES ('agent.command', $1, 10, $2, $3, $4) RETURNING id;",
      color: "#00FF66",
    },
    broker: {
      id: "broker",
      name: "2. PostgreSQL Core",
      badge: "ACID LOCK ENGINE",
      metric: "SKIP LOCKED",
      title: "BeastMQ Broker Engine",
      subtitle: "PostgreSQL 15+ Row-Level Locks & Idempotency",
      desc: "Zero Redis needed. Tasks are locked atomically using PostgreSQL's row-level locks. Heartbeat intervals periodically extend locked_until leases, preventing zombie jobs during crashes.",
      sql: "SELECT * FROM jobs WHERE (status = 'pending' AND available_at <= NOW()) OR (status = 'running' AND locked_until < NOW()) ORDER BY priority DESC, created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;",
      color: "#00FF66",
    },
    routing: {
      id: "routing",
      name: "3. Priority Concurrency",
      badge: "PRIORITY FIBERS",
      metric: "P10 · P5 · P0",
      title: "Priority Routing & Agent Hierarchy",
      subtitle: "Parent-Child Trees & Session Tracing",
      desc: "Tasks are prioritized and linked by parentJobId and traceId. Supervisors fan-out parallel child tasks and fan-in outputs when all subtasks complete or fail.",
      sql: "SELECT id, status, result FROM jobs WHERE parent_job_id = $1 AND trace_id = $2;",
      color: "#38bdf8",
    },
    workers: {
      id: "workers",
      name: "4. Worker Fleet",
      badge: "EXECUTION RUNNERS",
      metric: "10s Lease Heartbeat",
      title: "Distributed Worker Fleet",
      subtitle: "WorkerRunner Fibers & Process AbortSignals",
      desc: "Autonomous worker fibers process jobs concurrently. Built-in command and HTTP handlers execute with hard timeouts and AbortSignals, persisting structured outputs to jsonb.",
      sql: "UPDATE jobs SET status = 'completed', result = $2, completed_at = NOW() WHERE id = $1;",
      color: "#a855f7",
    },
    dlq: {
      id: "dlq",
      name: "5. Dead Letter Vault",
      badge: "FAIL-SAFE ARCHIVE",
      metric: "Exponential Backoff",
      title: "Dead Letter Queue (dead_jobs)",
      subtitle: "Exponential Backoff & Terminal Failure Storage",
      desc: "Jobs that fail are retried with exponential backoff (1s, 2s, 4s, 8s...). After maximum attempts, they are moved into dead_jobs with stack traces and can be resurrected anytime via CLI.",
      sql: "INSERT INTO dead_jobs (job_id, type, payload, attempts, error) SELECT id, type, payload, attempts, error FROM jobs WHERE id = $1;",
      color: "#f87171",
    },
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090d, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4.5, 19);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // 2. Subtle Cyber Ground Grid
    const gridHelper = new THREE.GridHelper(30, 30, 0x1f2937, 0x0f172a);
    gridHelper.position.y = -3.8;
    scene.add(gridHelper);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xa7f3d0, 1.8);
    dirLight.position.set(12, 18, 10);
    scene.add(dirLight);

    const coreLight = new THREE.PointLight(0x00ff66, 3.5, 25);
    coreLight.position.set(-2, 0.5, 0);
    scene.add(coreLight);

    const workerLight = new THREE.PointLight(0xa855f7, 2.5, 20);
    workerLight.position.set(7.5, 0, 0);
    scene.add(workerLight);

    // 4. Station 3D Node Meshes
    // Node Group
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    // --- Station 1: Producers (x = -8, y = 0, z = -1)
    const prodGroup = new THREE.Group();
    prodGroup.position.set(-8, 0, -0.5);
    const prodGeo = new THREE.OctahedronGeometry(1.4, 0);
    const prodMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x00ff66,
      emissiveIntensity: 0.25,
      metalness: 0.9,
      roughness: 0.2,
    });
    const prodMesh = new THREE.Mesh(prodGeo, prodMat);
    prodGroup.add(prodMesh);

    const prodWireMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, wireframe: true, transparent: true, opacity: 0.4 });
    const prodWire = new THREE.Mesh(prodGeo, prodWireMat);
    prodWire.scale.set(1.2, 1.2, 1.2);
    prodGroup.add(prodWire);
    nodesGroup.add(prodGroup);

    // --- Station 2: PostgreSQL ACID Broker (x = -2.5, y = 0.5, z = 0)
    const brokerGroup = new THREE.Group();
    brokerGroup.position.set(-2.5, 0.5, 0);

    // Multi-tier Database Cylinder
    const cylGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.2, 32);
    const cylMat = new THREE.MeshStandardMaterial({
      color: 0x0a1015,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x00ff66,
      emissiveIntensity: 0.15,
    });
    const cylMesh = new THREE.Mesh(cylGeo, cylMat);
    brokerGroup.add(cylMesh);

    // Outer rotating magnetic lock ring
    const ringGeo = new THREE.TorusGeometry(2.1, 0.08, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00ff66,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x00ff66,
      emissiveIntensity: 0.6,
    });
    const lockRing1 = new THREE.Mesh(ringGeo, ringMat);
    lockRing1.rotation.x = Math.PI / 2;
    brokerGroup.add(lockRing1);

    const lockRing2 = new THREE.Mesh(ringGeo, ringMat);
    lockRing2.rotation.x = Math.PI / 3;
    lockRing2.scale.set(1.15, 1.15, 1.15);
    brokerGroup.add(lockRing2);
    nodesGroup.add(brokerGroup);

    // --- Station 3: Priority Concurrency Router (x = 2.8, y = 0, z = 0.5)
    const routerGroup = new THREE.Group();
    routerGroup.position.set(2.8, 0, 0.5);

    const barGeo = new THREE.BoxGeometry(0.5, 2.4, 0.5);
    const barMat = new THREE.MeshStandardMaterial({
      color: 0x0c4a6e,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2,
    });
    [-0.8, 0, 0.8].forEach((offsetZ, idx) => {
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set((idx - 1) * 0.4, 0, offsetZ);
      routerGroup.add(bar);
    });
    nodesGroup.add(routerGroup);

    // --- Station 4: Distributed Workers (x = 8, y = 0.2, z = 0)
    const workerGroup = new THREE.Group();
    workerGroup.position.set(8, 0.2, 0);

    const workerCenterGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const workerCenterMat = new THREE.MeshStandardMaterial({
      color: 0x1e1035,
      emissive: 0xa855f7,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.2,
    });
    const workerCenter = new THREE.Mesh(workerCenterGeo, workerCenterMat);
    workerGroup.add(workerCenter);

    // Orbiting Worker Satellites
    const satGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const satMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.8,
    });
    const satellites: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const sat = new THREE.Mesh(satGeo, satMat);
      workerGroup.add(sat);
      satellites.push(sat);
    }
    nodesGroup.add(workerGroup);

    // --- Station 5: Dead Letter Vault (x = 1, y = -2.6, z = 1)
    const dlqGroup = new THREE.Group();
    dlqGroup.position.set(1, -2.6, 1);
    const dlqGeo = new THREE.OctahedronGeometry(1.0, 0);
    const dlqMat = new THREE.MeshStandardMaterial({
      color: 0x450a0a,
      emissive: 0xef4444,
      emissiveIntensity: 0.35,
      metalness: 0.8,
      roughness: 0.3,
    });
    const dlqMesh = new THREE.Mesh(dlqGeo, dlqMat);
    dlqGroup.add(dlqMesh);
    const dlqWireMat = new THREE.MeshBasicMaterial({ color: 0xf87171, wireframe: true, transparent: true, opacity: 0.4 });
    const dlqWire = new THREE.Mesh(dlqGeo, dlqWireMat);
    dlqWire.scale.set(1.25, 1.25, 1.25);
    dlqGroup.add(dlqWire);
    nodesGroup.add(dlqGroup);

    // 5. Spline Pathways Connecting the Stages
    const splinePaths: THREE.CatmullRomCurve3[] = [
      // Prod -> Broker
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-8, 0, -0.5),
        new THREE.Vector3(-5.2, 0.8, 0.2),
        new THREE.Vector3(-2.5, 0.5, 0),
      ]),
      // Broker -> Router
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.5, 0.5, 0),
        new THREE.Vector3(0.1, 0.4, 0.4),
        new THREE.Vector3(2.8, 0, 0.5),
      ]),
      // Router -> Workers
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.8, 0, 0.5),
        new THREE.Vector3(5.5, 0.3, 0.2),
        new THREE.Vector3(8, 0.2, 0),
      ]),
      // Workers -> DLQ (Failure branch)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(8, -0.2, 0),
        new THREE.Vector3(5, -1.8, 0.8),
        new THREE.Vector3(1, -2.6, 1),
      ]),
      // DLQ -> Broker (Resurrection Replay)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1, -2.6, 1),
        new THREE.Vector3(-1.2, -1.5, 0.4),
        new THREE.Vector3(-2.5, 0.2, 0),
      ]),
    ];

    // Render Neon Tube Guides
    splinePaths.forEach((spline, idx) => {
      const isDLQ = idx >= 3;
      const pts = spline.getPoints(50);
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: isDLQ ? 0xef4444 : idx === 1 ? 0x38bdf8 : 0x00ff66,
        transparent: true,
        opacity: isDLQ ? 0.35 : 0.4,
      });
      const line = new THREE.Line(geom, mat);
      scene.add(line);
    });

    // 6. Particle Energy Flow along the Splines
    const totalParticles = 160;
    const particlePositions = new Float32Array(totalParticles * 3);
    const particleColors = new Float32Array(totalParticles * 3);
    const particleProgress: { splineIdx: number; t: number; speed: number }[] = [];

    for (let i = 0; i < totalParticles; i++) {
      const splineIdx = Math.floor(Math.random() * splinePaths.length);
      const t = Math.random();
      const speed = 0.003 + Math.random() * 0.006;
      particleProgress.push({ splineIdx, t, speed });

      const pt = splinePaths[splineIdx]!.getPoint(t);
      particlePositions[i * 3] = pt.x;
      particlePositions[i * 3 + 1] = pt.y;
      particlePositions[i * 3 + 2] = pt.z;

      // Color based on spline path
      if (splineIdx >= 3) {
        // DLQ path: Red/Amber
        particleColors[i * 3] = 1;
        particleColors[i * 3 + 1] = 0.3;
        particleColors[i * 3 + 2] = 0.3;
      } else if (splineIdx === 1) {
        // Router path: Cyan
        particleColors[i * 3] = 0.2;
        particleColors[i * 3 + 1] = 0.8;
        particleColors[i * 3 + 2] = 1;
      } else {
        // Ingestion & Workers: Electric Green
        particleColors[i * 3] = 0;
        particleColors[i * 3 + 1] = 1;
        particleColors[i * 3 + 2] = 0.4;
      }
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Interactive Parallax & Animation Loop
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 3.5;
      targetY = -y * 2.5;
    };

    window.addEventListener("mousemove", onMouseMove);

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Camera Damping
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      camera.position.x = currentX * 1.5;
      camera.position.y = 4.5 + currentY * 1.2;
      camera.lookAt(0, -0.2, 0);

      // Rotate Stage 1: Producers
      prodMesh.rotation.y += 0.5 * delta;
      prodWire.rotation.x += 0.3 * delta;

      // Rotate Stage 2: PostgreSQL Broker
      cylMesh.rotation.y += 0.25 * delta;
      lockRing1.rotation.z += 0.8 * delta;
      lockRing2.rotation.z -= 0.6 * delta;

      // Stage 3: Router pulse
      routerGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.15;

      // Stage 4: Workers satellite orbit
      workerCenter.rotation.y += 0.4 * delta;
      workerCenter.rotation.x += 0.2 * delta;
      satellites.forEach((sat, idx) => {
        const angle = elapsed * 1.5 + (idx * Math.PI) / 2;
        const radius = 1.9;
        sat.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.5) * 0.5, Math.sin(angle) * radius);
        sat.rotation.x += 0.02;
        sat.rotation.y += 0.03;
      });

      // Stage 5: DLQ rotation
      dlqMesh.rotation.y += 0.4 * delta;
      dlqWire.rotation.z -= 0.5 * delta;

      // Advance particles along splines
      const posAttr = particleGeo.getAttribute("position") as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < totalParticles; i++) {
        const p = particleProgress[i]!;
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.splineIdx = Math.floor(Math.random() * splinePaths.length);
        }

        const point = splinePaths[p.splineIdx]!.getPoint(p.t);
        posArray[i * 3] = point.x + (Math.random() - 0.5) * 0.08;
        posArray[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.08;
        posArray[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.08;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    const ticker = setInterval(() => {
      setPipelineMetrics((prev) => ({
        enqueued: prev.enqueued + Math.floor(Math.random() * 8 + 2),
        lockedMs: +(1.2 + Math.random() * 0.5).toFixed(1),
        workersActive: 8,
        dlqRecoveries: prev.dlqRecoveries,
      }));
    }, 1200);

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
    <div className="space-y-6">
      {/* 3D WebGL Pipeline Box */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0A0D12] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.85)]">
        
        {/* Top Telemetry Header */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-black/50 gap-3 z-20 relative">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]/70" />
            </div>
            <span className="text-xs font-mono font-medium text-zinc-300">
              Pipeline Topology :: <span className="text-white">Distributed ACID Graph</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66]">
              <Database className="w-3.5 h-3.5" />
              <span className="font-bold">SKIP LOCKED</span>
              <span className="text-[10px] text-zinc-400">({pipelineMetrics.lockedMs}ms)</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-300">
              <span>Throughput:</span>
              <span className="text-[#00FF66] font-bold">12,480/s</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-300">
              <span>DLQ Drops:</span>
              <span className="text-emerald-400 font-bold">0 (0.00%)</span>
            </div>
          </div>
        </div>

        {/* 3D WebGL Canvas Viewport */}
        <div className="relative w-full h-[400px] sm:h-[480px] bg-grid-pattern overflow-hidden">
          <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Floating Spatial Labels */}
          <div className="absolute top-5 left-5 pointer-events-none hidden md:block">
            <div className="p-3 rounded-xl border border-white/[0.1] bg-[#0E1219]/80 backdrop-blur-md shadow-xl text-xs font-mono space-y-1 max-w-[210px]">
              <div className="text-[10px] text-[#00FF66] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3 h-3" />
                Ingestion Node
              </div>
              <div className="text-white font-bold">Autonomous Agents</div>
              <p className="text-[10px] text-zinc-400 font-sans leading-tight">
                Single instant tool call offloads &gt;15s commands with zero turn timeout.
              </p>
            </div>
          </div>

          <div className="absolute top-5 right-5 pointer-events-none hidden md:block">
            <div className="p-3 rounded-xl border border-white/[0.1] bg-[#0E1219]/80 backdrop-blur-md shadow-xl text-xs font-mono space-y-1 max-w-[210px] text-right">
              <div className="text-[10px] text-purple-400 uppercase tracking-wider flex items-center justify-end gap-1.5">
                <Cpu className="w-3 h-3" />
                Worker Fleet
              </div>
              <div className="text-white font-bold">Concurrent Fibers</div>
              <p className="text-[10px] text-zinc-400 font-sans leading-tight">
                10s heartbeat leases with automatic crash recovery &amp; AbortSignals.
              </p>
            </div>
          </div>

          <div className="absolute bottom-5 left-5 pointer-events-none hidden sm:block">
            <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-950/30 backdrop-blur-md text-[11px] font-mono text-red-300 flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span>DLQ Recovery Loop: Exponential retry to dead_jobs</span>
            </div>
          </div>
        </div>

        {/* Stage Selector Bar */}
        <div className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#0A0D12] grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.values(stages).map((st) => (
            <button
              key={st.id}
              onClick={() => setActiveStage(st.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeStage === st.id
                  ? "border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_15px_rgba(0,255,102,0.15)]"
                  : "border-white/[0.06] bg-[#0E1219]/60 hover:border-white/[0.15] hover:bg-white/[0.02]"
              }`}
            >
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between mb-1">
                <span>{st.badge}</span>
                <span className="text-[#00FF66] font-bold text-[9px]">{st.metric}</span>
              </div>
              <div className="text-xs font-mono font-bold text-white truncate">
                {st.name}
              </div>
            </button>
          ))}
        </div>

        {/* Live SQL & Architecture Inspector Drawer */}
        <div className="p-5 border-t border-white/[0.06] bg-black/60 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3 mb-3">
            <div>
              <span className="text-xs text-[#00FF66] font-bold block">
                INSPECTING STAGE: {stages[activeStage].title}
              </span>
              <span className="text-[11px] text-zinc-400">
                {stages[activeStage].subtitle}
              </span>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.06]">
              Interactive 3D Stage Inspector
            </span>
          </div>

          <p className="text-xs text-zinc-300 font-sans leading-relaxed mb-3">
            {stages[activeStage].desc}
          </p>

          <div className="p-3 rounded-lg bg-[#07090D] border border-white/[0.04] text-[11px] text-emerald-300 overflow-x-auto">
            <span className="text-zinc-500 select-none mr-2">SQL &gt;</span>
            <code>{stages[activeStage].sql}</code>
          </div>
        </div>

      </div>
    </div>
  );
}
