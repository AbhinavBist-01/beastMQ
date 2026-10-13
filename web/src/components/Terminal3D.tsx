"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Terminal, Copy, Check, CheckCircle2, Play, Cpu, Sparkles, Shield, RefreshCw } from "lucide-react";

interface WorkflowItem {
  id: string;
  label: string;
  title: string;
  badge: string;
  desc: string;
  command: string;
  lines: string[];
}

export function Terminal3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedCmd, setSelectedCmd] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"3d" | "raw">("3d");

  const workflows: WorkflowItem[] = [
    {
      id: "drain",
      label: "worker --drain",
      title: "One-Shot Queue Draining",
      badge: "AI AGENT NATIVE",
      desc: "Designed for autonomous coding agents: processes all pending tasks to completion and exits cleanly without lingering background daemons.",
      command: "npx beastmq worker --drain",
      lines: [
        "⚡ beastMQ Worker [drain-mode] started.",
        "Worker 7f83a210-9b4e-48a1 concurrency: 5",
        "CLAIM: job 4a2b9e11 (agent.command) acquired via SKIP LOCKED",
        "Heartbeat active (10s interval, 300s lease)",
        "Executing: pnpm build && pnpm test",
        "✓ Task 4a2b9e11 completed successfully (2,410ms).",
        "Queue empty. Drained 1 total job(s).",
        "Worker stopped cleanly. Exit code 0.",
      ],
    },
    {
      id: "status",
      label: "status <id>",
      title: "Inspect Job Status & Result",
      badge: "JSONB RESULT",
      desc: "Retrieve granular execution timestamps, worker lease IDs, retry attempts, and the structured JSONB result payload directly from PostgreSQL.",
      command: "npx beastmq status 4a2b9e11-88fc-4271-9128-49ba7c8021da",
      lines: [
        "{",
        '  "id": "4a2b9e11-88fc-4271-9128-49ba7c8021da",',
        '  "type": "agent.command",',
        '  "status": "completed",',
        '  "priority": 10,',
        '  "attempts": 1,',
        '  "agentRole": "code_executor",',
        '  "startedAt": "2026-10-12T18:14:20.112Z",',
        '  "completedAt": "2026-10-12T18:14:22.522Z",',
        '  "result": { "exitCode": 0, "durationMs": 2410 }',
        "}",
      ],
    },
    {
      id: "trace",
      label: "trace <traceId>",
      title: "Multi-Agent Session Tracing",
      badge: "PARENT-CHILD TREE",
      desc: "Inspect supervisor and child subagent task hierarchies across a unified traceId correlation session with execution timings.",
      command: "npx beastmq trace session_deploy_99",
      lines: [
        "⚡ Trace: session_deploy_99 (3 linked jobs)",
        "----------------------------------------------------------------",
        "[PARENT]    9b12a8... supervisor.deploy      status: completed",
        "  └── [SUBTASK] 4a2b9e... agent.command        status: completed",
        "  └── [SUBTASK] 8c33f1... agent.http           status: completed",
        "All 3 tasks verified. Parent-child fan-in completed.",
      ],
    },
    {
      id: "dlq",
      label: "dlq replay",
      title: "Dead Letter Queue Recovery",
      badge: "RESURRECTION",
      desc: "Instantly resurrect permanently failed jobs from the dead_jobs archive table back into the active pending queue with clean retry metadata.",
      command: "npx beastmq dlq replay dead_81fa9902",
      lines: [
        "Fetching dead job record: dead_81fa9902",
        'Error logged: "Connection timeout to payment gateway after 5 attempts"',
        "✓ Replaying dead job into active queue...",
        "New pending Job ID: e128b9aa-7719-482a-bc81-817290aa2102",
        "Archived DLQ record removed. Ready for claim.",
      ],
    },
  ];

  // Ref to update dynamic canvas texture whenever workflow changes
  const updateTextureRef = useRef<() => void>(() => {});

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06080c, 0.025);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // 2. Cyber grid ground plane
    const grid = new THREE.GridHelper(24, 24, 0x1f2937, 0x0f172a);
    grid.position.y = -3.8;
    scene.add(grid);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00ff66, 1.8);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-10, -5, -6);
    scene.add(rimLight);

    // 4. Dynamic Offscreen 2D Canvas for High-DPI Terminal Screen
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext("2d")!;

    let currentLines = workflows[selectedCmd].lines;
    let currentCmdStr = workflows[selectedCmd].command;

    const drawTerminalScreen = (blinkCursor: boolean = true) => {
      // Background chassis screen
      ctx.fillStyle = "#070A0F";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // CRT Scanlines effect
      ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }

      // Top Window Header Bar
      ctx.fillStyle = "#0F141C";
      ctx.fillRect(0, 0, canvas.width, 54);

      // Window dots
      ctx.fillStyle = "#EF4444";
      ctx.beginPath();
      ctx.arc(32, 27, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.arc(56, 27, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#00FF66";
      ctx.beginPath();
      ctx.arc(80, 27, 7, 0, Math.PI * 2);
      ctx.fill();

      // Title
      ctx.fillStyle = "#94A3B8";
      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.fillText("beastmq — autonomous terminal shell (80x24)", 116, 33);

      // Terminal Prompt
      ctx.fillStyle = "#00FF66";
      ctx.font = "bold 20px 'Courier New', monospace";
      ctx.fillText("developer@agent-fleet:~$ ", 32, 95);

      ctx.fillStyle = "#F8FAFC";
      ctx.fillText(currentCmdStr, 320, 95);

      if (blinkCursor) {
        ctx.fillStyle = "#00FF66";
        const cmdWidth = ctx.measureText(currentCmdStr).width;
        ctx.fillRect(324 + cmdWidth, 78, 11, 20);
      }

      // Output Lines
      ctx.font = "18px 'Courier New', monospace";
      let startY = 145;
      currentLines.forEach((line) => {
        if (line.includes("⚡") || line.includes("CLAIM") || line.includes("✓")) {
          ctx.fillStyle = "#00FF66";
        } else if (line.includes("Error") || line.includes("DLQ")) {
          ctx.fillStyle = "#F87171";
        } else if (line.includes("[PARENT]") || line.includes("[SUBTASK]")) {
          ctx.fillStyle = "#38BDF8";
        } else if (line.includes('"') && line.includes(":")) {
          ctx.fillStyle = "#E2E8F0";
        } else {
          ctx.fillStyle = "#94A3B8";
        }
        ctx.fillText(line, 32, startY);
        startY += 34;
      });

      // Bottom Status Indicator
      ctx.fillStyle = "#0F141C";
      ctx.fillRect(0, canvas.height - 38, canvas.width, 38);

      ctx.fillStyle = "#00FF66";
      ctx.beginPath();
      ctx.arc(28, canvas.height - 19, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#64748B";
      ctx.font = "14px 'Courier New', monospace";
      ctx.fillText("READY · ZERO TIMEOUTS · POSTGRESQL ACID DURABLE", 46, canvas.height - 14);
    };

    drawTerminalScreen();

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.minFilter = THREE.LinearFilter;
    canvasTexture.magFilter = THREE.LinearFilter;

    // Connect ref to update canvas texture
    updateTextureRef.current = () => {
      currentLines = workflows[selectedCmd].lines;
      currentCmdStr = workflows[selectedCmd].command;
      drawTerminalScreen();
      canvasTexture.needsUpdate = true;
    };

    // 5. 3D Terminal Console Blade Mesh
    const consoleGroup = new THREE.Group();
    scene.add(consoleGroup);

    // Outer Back Chassis
    const chassisGeo = new THREE.BoxGeometry(9.6, 6.0, 0.4);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f17,
      metalness: 0.9,
      roughness: 0.25,
    });
    const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    consoleGroup.add(chassisMesh);

    // Glowing Neon Border Bezel
    const bezelGeo = new THREE.BoxGeometry(9.68, 6.08, 0.36);
    const bezelMat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    consoleGroup.add(bezelMesh);

    // Front Screen Surface (with CanvasTexture)
    const screenGeo = new THREE.PlaneGeometry(9.2, 5.6);
    const screenMat = new THREE.MeshBasicMaterial({
      map: canvasTexture,
      toneMapped: false,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.21;
    consoleGroup.add(screenMesh);

    // 6. Floating Holographic Data Elements Around Console
    const floatingGroup = new THREE.Group();
    scene.add(floatingGroup);

    // Left floating chip
    const chipGeo = new THREE.BoxGeometry(0.8, 0.8, 0.1);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x00ff66,
      emissive: 0x00ff66,
      emissiveIntensity: 0.6,
      wireframe: true,
    });
    const chip1 = new THREE.Mesh(chipGeo, chipMat);
    chip1.position.set(-5.6, 2.2, 0.5);
    floatingGroup.add(chip1);

    // Right floating chip
    const chip2 = new THREE.Mesh(chipGeo, chipMat);
    chip2.position.set(5.6, -1.8, 0.8);
    floatingGroup.add(chip2);

    // Orbiting particle dust
    const dustCount = 80;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 18;
      dustPositions[i + 1] = (Math.random() - 0.5) * 10;
      dustPositions[i + 2] = (Math.random() - 0.5) * 8;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x00ff66,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);

    // 7. Interactive 3D Parallax & Tilt
    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      // Gyroscopic tilt
      targetRotY = x * 0.45;
      targetRotX = -y * 0.35;
    };

    window.addEventListener("mousemove", onMouseMove);

    // 8. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let lastBlink = 0;
    let cursorState = true;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth tilt damping
      curRotX += (targetRotX - curRotX) * 0.08;
      curRotY += (targetRotY - curRotY) * 0.08;

      consoleGroup.rotation.x = curRotX;
      consoleGroup.rotation.y = curRotY;
      consoleGroup.position.y = Math.sin(elapsed * 1.5) * 0.12;

      // Subtle rotation for floating chips
      chip1.rotation.x += 0.02;
      chip1.rotation.y += 0.03;
      chip2.rotation.x -= 0.02;
      chip2.rotation.y -= 0.03;

      // Cursor Blink every 500ms
      if (elapsed - lastBlink > 0.5) {
        lastBlink = elapsed;
        cursorState = !cursorState;
        drawTerminalScreen(cursorState);
        canvasTexture.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update canvas texture on command change
  useEffect(() => {
    updateTextureRef.current();
  }, [selectedCmd]);

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Command Selectors */}
      <div className="lg:col-span-4 space-y-3">
        {workflows.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setSelectedCmd(idx)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedCmd === idx
                ? "border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_20px_rgba(0,255,102,0.12)]"
                : "border-white/[0.06] bg-[#0A0D12]/70 hover:border-white/[0.15] hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>$ beastmq {item.label}</span>
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

        {/* Quick hint box */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 text-xs font-mono text-zinc-400 space-y-1.5">
          <div className="text-white font-bold flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-[#00FF66]" />
            Direct CLI &amp; Agent Tool Compatible
          </div>
          <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
            Every command can be executed from your terminal or directly invoked as an autonomous agent tool without complex wrappers.
          </p>
        </div>
      </div>

      {/* Right Column: 3D Terminal Canvas Viewport */}
      <div className="lg:col-span-8 rounded-2xl border border-white/[0.08] bg-[#0A0D12] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        
        {/* Terminal Blade Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-black/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66]/70" />
            </div>
            <span className="text-xs font-mono text-zinc-300">
              3D Holographic Blade :: <span className="text-white">$ {workflows[selectedCmd].command}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(workflows[selectedCmd].command)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] text-zinc-300 hover:text-white hover:border-[#00FF66]/50 transition-all text-xs font-mono"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span className="text-[#00FF66] font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Command</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Three.js 3D Interactive Console Canvas */}
        <div className="relative w-full h-[400px] sm:h-[450px] bg-grid-pattern overflow-hidden">
          <div
            ref={mountRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Interactive Hint Overlay */}
          <div className="absolute bottom-4 right-4 pointer-events-none hidden sm:block">
            <div className="px-3 py-1.5 rounded-lg border border-white/[0.1] bg-black/70 backdrop-blur-md text-[11px] font-mono text-zinc-400 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[#00FF66]" />
              <span>Hover cursor to tilt terminal in 3D perspective</span>
            </div>
          </div>
        </div>

        {/* Real-time Execution Code Drawer */}
        <div className="p-4 border-t border-white/[0.06] bg-[#07090D] font-mono text-xs text-zinc-300 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[#00FF66] select-none">$</span>
            <code className="text-white font-semibold truncate">{workflows[selectedCmd].command}</code>
          </div>
          <span className="text-[11px] text-zinc-500 shrink-0 hidden sm:inline">
            Exit Code 0 · Completed
          </span>
        </div>

      </div>
    </div>
  );
}
