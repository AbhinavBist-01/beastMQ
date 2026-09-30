# ⚡ beastMQ: The Agent-Native Task Queue & Workflow Orchestration Engine

> **A durable, PostgreSQL-backed asynchronous execution layer for AI Agents, Subagents, and Multi-Agent Workflows.**  
> _Zero Redis. Strict Durability. Turn-Timeout Prevention. Distributed Idempotency. Universal Open Skill (`skills.sh`)._

---

## 📑 Table of Contents

- [The Agent Problem: Why beastMQ?](#-the-agent-problem-why-beastmq)
- [How beastMQ Solves Agent Bottlenecks](#-how-beastmq-solves-agent-bottlenecks)
- [Multi-Agent Architecture & Flow](#-multi-agent-architecture--flow)
- [Installation & Quickstart](#-installation--quickstart)
  - [1. Install as an Agent Skill (`npx skills`)](#1-install-as-an-agent-skill-npx-skills)
  - [2. Terminal CLI (`npx beastmq`)](#2-terminal-cli-npx-beastmq)
  - [3. Programmatic TypeScript SDK](#3-programmatic-typescript-sdk)
- [Agentic Core Features](#-agentic-core-features)
  - [Subagent Task Hierarchy & Tracing](#1-subagent-task-hierarchy--tracing)
  - [Dynamic Task & Tool Registry](#2-dynamic-task--tool-registry)
  - [Non-Blocking Results & Structured JSON Persistence](#3-non-blocking-results--structured-json-persistence)
  - [Distributed Idempotency (Prevent Duplicate Tool Runs)](#4-distributed-idempotency-prevent-duplicate-tool-runs)
  - [Atomic Claims (`FOR UPDATE SKIP LOCKED`)](#5-atomic-claims-for-update-skip-locked)
  - [Lease-Based Worker Crash Recovery](#6-lease-based-worker-crash-recovery)
  - [Exponential Backoff Retries & Dead Letter Queue (DLQ)](#7-exponential-backoff-retries--dead-letter-queue-dlq)
  - [Graceful Shutdown & Drain](#8-graceful-shutdown--drain)
- [HTTP API Reference for Agents](#-http-api-reference-for-agents)
  - [`POST /jobs` (Enqueue Task / Subtask)](#post-jobs-enqueue-task--subtask)
  - [`GET /jobs/:id` (Query Status & Result)](#get-jobsid-query-status--result)
  - [`GET /agent/tasks/:id/subtasks` (Subagent Fan-In)](#get-agenttasksidsubtasks-subagent-fan-in)
  - [`GET /agent/traces/:traceId` (Trace Correlation)](#get-agenttracestraceid-trace-correlation)
  - [`GET /dead-jobs` & `POST /dead-jobs/:id/replay` (DLQ Forensics)](#get-dead-jobs--post-dead-jobsidreplay-dlq-forensics)
- [Database Schema & Data Model](#-database-schema--data-model)
- [Setup & Running with `npm`](#-setup--running-with-npm)
- [Testing & Verification](#-testing--verification)
- [Modular Architecture & Structure](#-modular-architecture--structure)
- [License](#-license)

---

## 🛑 The Agent Problem: Why beastMQ?

Autonomous AI coding agents (Claude Code, Cursor, Windsurf, Antigravity, Copilot, custom LangGraph/AutoGen swarms) face hard production constraints:

1. **Turn & Tool Timeouts**: A single tool call that takes 60 seconds (data processing, web crawling, code generation, running test suites) blocks the LLM turn and triggers tool execution timeouts.
2. **Subagent Orchestration**: Complex tasks require an orchestrator agent to fan-out subtasks across parallel subagents (`code_reviewer`, `researcher`, `tester`) and aggregate the structured results without deadlock.
3. **Duplicate Tool Execution**: Network blips or agent retry loops cause side-effecting tools (charging credit cards, deploying code, dispatching webhooks) to fire repeatedly without distributed idempotency locks.
4. **Worker Crashes & Ephemeral State Loss**: When background containers or agents crash, in-flight work disappears unless backed by durable storage.
5. **Infrastructure Bloat**: Setting up dedicated Redis clusters, Celery, or RabbitMQ adds significant operational cost, consistency bugs, and dual-write problems.

---

## 💡 How beastMQ Solves Agent Bottlenecks

**beastMQ** turns **PostgreSQL** into a transactional, crash-resilient queue and agent task orchestration engine using native row-level lock primitives (`FOR UPDATE SKIP LOCKED`).

| Agent Need                          | Traditional Broker (Redis / BullMQ)          | beastMQ (PostgreSQL Agent-First)                            |
| :---------------------------------- | :------------------------------------------- | :---------------------------------------------------------- |
| **Durability & ACID State**         | In-memory RAM (risk of loss on restart)      | **WAL-backed PostgreSQL tables**                            |
| **Operational Overhead**            | Dedicated Redis instance / cluster           | **Zero new infrastructure** (reuses your existing DB)       |
| **Atomic Outbox Enqueue**           | Dual-write problem / requires outbox relayer | **Enqueues atomically inside your business transactions**   |
| **Subagent Parent-Child Hierarchy** | Custom schema or external orchestrator       | **Native `parentJobId` and `traceId` correlation**          |
| **Result Persistence**              | Ephemeral or TTL-evicted                     | **Persistent `result: jsonb` storage for agent inspection** |
| **Tool Idempotency**                | Application-level caching                    | **Distributed DB lock state machine (`idempotency_keys`)**  |
| **Agent Ecosystem Compatibility**   | Proprietary APIs                             | **Universal Agent Skill (`skills.sh`) + `npx beastmq` CLI** |

---

## 🏗️ Multi-Agent Architecture & Flow

```mermaid
flowchart TD
    subgraph Agents ["Autonomous AI Agents & Orchestrators"]
        Orchestrator["Orchestrator Agent\n(e.g., Planner / Coordinator)"]
        SubagentA["Subagent A\n(Role: Researcher)"]
        SubagentB["Subagent B\n(Role: Code Reviewer)"]
    end

    subgraph Interface ["Agent Interfaces"]
        SkillPkg["Universal Agent Skill\n(skills/beastmq/SKILL.md)"]
        CLI["CLI Tool: npx beastmq"]
        SDK["TypeScript SDK: BeastMQClient"]
    end

    subgraph Database ["PostgreSQL Durability Engine (ACID)"]
        JobsTable[("jobs Table\n(payload, result, parentJobId, traceId, agentRole)")]
        IdempTable[("idempotency_keys Table\n(Distributed Tool Locks)")]
        DLQTable[("dead_jobs Table\n(DLQ Archive)")]
    end

    subgraph Workers ["beastMQ Worker Engine"]
        TaskReg["Task / Tool Registry\n(taskRegistry.register)"]
        ExecWatchdog["Task Runner & Timeout Watchdog"]
        HeartbeatLoop["Heartbeat Lease Renewer (10s)"]
    end

    Orchestrator -->|1. Enqueue Parent Task| SDK
    SDK -->|POST /jobs| JobsTable
    Orchestrator -->|2. Spawn Subagent Tasks\n(parentJobId, traceId)| SDK
    SDK -->|POST /jobs| JobsTable

    JobsTable -->|3. SELECT FOR UPDATE SKIP LOCKED| Workers
    Workers --> TaskReg
    TaskReg --> ExecWatchdog
    ExecWatchdog --> HeartbeatLoop
    HeartbeatLoop -->|Renew locked_until lease| JobsTable

    ExecWatchdog -->|4. Save Computed JSON Result| JobsTable
    ExecWatchdog -->|If fatal failure (attempts >= 5)| DLQTable

    JobsTable -.->|5. Await Result / Fan-In| Orchestrator
```

---

## 🚀 Installation & Quickstart

### 1. Install as an Agent Skill (`npx skills`)

beastMQ implements the open **`skills.sh`** / **`agentskills.io`** specification. You can install it directly into **Claude Code, Cursor, Windsurf, Antigravity, or Copilot**:

```bash
# Install via skills.sh ecosystem
npx skills add <github-user>/beastmq

# Or install locally from your clone
npx skills add .
```

_The skill runbook is located in [`skills/beastmq/SKILL.md`](file:///C:/Users/abhin/OneDrive/Desktop/Explore/beastMQ/skills/beastmq/SKILL.md) and [`SKILL.md`](file:///C:/Users/abhin/OneDrive/Desktop/Explore/beastMQ/SKILL.md)._

---

### 2. Terminal CLI (`npx beastmq`)

Agents with shell/bash execution permissions can invoke `npx beastmq` without writing boilerplate:

```bash
# Enqueue a heavy research task
npx beastmq enqueue \
  --type "agent.research" \
  --payload '{"topic": "Postgres SKIP LOCKED queue performance"}' \
  --role "researcher" \
  --trace-id "session_401" \
  --priority 10

# Spawn a child subtask linked to a parent
npx beastmq enqueue \
  --type "agent.summarize" \
  --payload '{"documentId": "doc_99"}' \
  --parent-id "7b520d8e-88d5-44e3-9d30-09b128f3d96a" \
  --role "summarizer"

# Wait for completion and print the structured JSON result
npx beastmq wait 7b520d8e-88d5-44e3-9d30-09b128f3d96a --timeout 30000

# Check job status and result
npx beastmq status 7b520d8e-88d5-44e3-9d30-09b128f3d96a

# Inspect Dead Letter Queue (DLQ)
npx beastmq dlq list

# Replay a failed job
npx beastmq dlq replay 4b2c394f-61aa-402f-82c7-8f587482e27b
```

---

### 3. Programmatic TypeScript SDK

For agent applications, microservices, and tool runners:

```typescript
import { BeastMQClient, taskRegistry } from "beastmq";

const client = new BeastMQClient();

// 1. Register an Agent Tool or Task Handler
taskRegistry.register(
  "agent.web_scrape",
  async (payload: { url: string }, context) => {
    // context provides: jobId, traceId, parentJobId, agentRole, attempts
    console.log(`Scraping ${payload.url} for agent role: ${context.agentRole}`);
    const html = await fetch(payload.url).then((r) => r.text());

    // Return value is automatically persisted to jobs.result
    return {
      url: payload.url,
      contentLength: html.length,
      scrapedAt: new Date().toISOString(),
    };
  },
);

// 2. Enqueue the task
const job = await client.enqueue({
  type: "agent.web_scrape",
  payload: { url: "https://news.ycombinator.com" },
  traceId: "trace-session-102",
  agentRole: "web_researcher",
  priority: 5,
});

// 3. Await the structured result without blocking turns
const completed = await client.waitForJob(job.id, { timeoutMs: 20_000 });
console.log("Agent Task Output:", completed.result);
```

---

## 🧠 Agentic Core Features

### 1. Subagent Task Hierarchy & Tracing

Every task supports `parentJobId`, `traceId`, and `agentRole`. An orchestrator agent can spawn multiple subtasks in parallel, and later call:

```typescript
const subtasks = await client.getSubtasks(parentJobId);
```

to inspect all child subagent progress and fan-in their results.

---

### 2. Dynamic Task & Tool Registry

Agents can register and hot-load handlers for specific tasks:

```typescript
taskRegistry.register("tool.code_review", async (payload, context) => {
  return await analyzeCodeDiff(payload.diff);
});
```

If no custom handler is registered, beastMQ falls back to default simulation handling, guaranteeing 100% backward compatibility.

---

### 3. Non-Blocking Results & Structured JSON Persistence

Unlike simple message brokers where outputs are forgotten after acknowledgment, beastMQ saves the handler's returned value into a persistent `result: jsonb` column on the `jobs` table. Agents can query results minutes, hours, or days later.

---

### 4. Distributed Idempotency (Prevent Duplicate Tool Runs)

Agents frequently retry requests due to network blips or LLM hallucinations. With `idempotencyKey`:

- **Producer level**: Duplicate submissions return `200 OK` with `{ duplicate: true, id }` instead of inserting a second job.
- **Consumer level**: The distributed `idempotency_keys` table tracks `processing` vs `completed` status with active worker leases, preventing concurrent duplicate tool execution across the worker fleet.

---

### 5. Atomic Claims (`FOR UPDATE SKIP LOCKED`)

Workers claim jobs using PostgreSQL row-level locks inside an atomic transaction:

```sql
SELECT * FROM jobs
WHERE (status = 'pending' AND available_at <= NOW())
   OR (status = 'running' AND locked_until < NOW())
ORDER BY priority DESC, created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

- **Zero collisions**: Concurrent workers never claim the same task.
- **Strict prioritization**: Highest `priority` runs first, falling back to FIFO order (`created_at ASC`).

---

### 6. Lease-Based Worker Crash Recovery

Every claimed job receives a time-bounded lease (`locked_until = NOW() + LEASE_DURATION_MS`).

- Active workers emit background heartbeats every 10 seconds to renew their lease.
- If a worker crashes or is OOM-killed, its heartbeat ceases. Once `locked_until` expires, a peer worker claims and completes the job.

---

### 7. Exponential Backoff Retries & Dead Letter Queue (DLQ)

- **Exponential Backoff**: When a job throws an exception or hits a timeout, it is rescheduled with exponential delay:
  $$\text{Delay} = 1000 \times 2^{(\text{attempts} - 1)} \text{ ms}$$
- **Dead Letter Queue (DLQ)**: After 5 attempts, the job is archived to the `dead_jobs` table with its error stack trace and payload, and can be resurrected via `client.replayDeadJob(id)`.

---

### 8. Graceful Shutdown & Drain

Workers listen for `SIGINT`, `SIGTERM`, IPC, and STDIN `"shutdown"` signals. When triggered:

- Workers immediately cease claiming new jobs.
- Active in-flight tasks are allowed to finish and write their results to the database before the process exits cleanly.

---

## 📡 HTTP API Reference for Agents

### `POST /jobs` (Enqueue Task / Subtask)

**Headers:** `Content-Type: application/json`

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent.summarize",
    "payload": { "text": "Long context string..." },
    "priority": 10,
    "idempotencyKey": "summary_task_hash_123",
    "traceId": "trace_agent_42",
    "parentJobId": "18a4a523-8bc6-46f9-b88a-ea4c5eb44509",
    "agentRole": "summarizer"
  }'
```

**Response (`201 Created`):**

```json
{
  "id": "7b520d8e-88d5-44e3-9d30-09b128f3d96a",
  "status": "pending"
}
```

---

### `GET /jobs/:id` (Query Status & Result)

```bash
curl http://localhost:3000/jobs/7b520d8e-88d5-44e3-9d30-09b128f3d96a
```

**Response (`200 OK`):**

```json
{
  "id": "7b520d8e-88d5-44e3-9d30-09b128f3d96a",
  "type": "agent.summarize",
  "status": "completed",
  "payload": { "text": "Long context string..." },
  "result": { "summary": "Concise executive overview..." },
  "attempts": 1,
  "traceId": "trace_agent_42",
  "parentJobId": "18a4a523-8bc6-46f9-b88a-ea4c5eb44509",
  "agentRole": "summarizer",
  "startedAt": "2026-09-30T18:13:30.000Z",
  "completedAt": "2026-09-30T18:13:31.000Z"
}
```

---

### `GET /agent/tasks/:id/subtasks` (Subagent Fan-In)

Returns all child jobs linked to a parent job ID.

### `GET /agent/traces/:traceId` (Trace Correlation)

Returns all jobs across an entire agent conversation or trace.

### `GET /dead-jobs` & `POST /dead-jobs/:id/replay` (DLQ Forensics)

Inspect failed jobs and replay them back into `status = 'pending'`.

---

## 🗄️ Database Schema & Data Model

### `jobs` Table

| Column            | Type                     | Description                                         |
| :---------------- | :----------------------- | :-------------------------------------------------- |
| `id`              | `uuid PRIMARY KEY`       | Unique job identifier (`gen_random_uuid()`)         |
| `type`            | `varchar(255)`           | Task routing type (e.g. `agent.scrape`)             |
| `priority`        | `integer DEFAULT 0`      | Priority weighting (higher claims first)            |
| `payload`         | `jsonb`                  | Input payload for the task                          |
| `status`          | `text DEFAULT 'pending'` | `pending`, `running`, `completed`, `dead`           |
| `result`          | `jsonb`                  | **Structured execution output produced by handler** |
| `trace_id`        | `text`                   | **Correlation trace ID for agent conversation**     |
| `parent_job_id`   | `uuid`                   | **Parent task ID for subagent hierarchy**           |
| `agent_role`      | `text`                   | **Role name of the executing subagent**             |
| `locked_by`       | `text`                   | Worker UUID holding active lease                    |
| `locked_until`    | `timestamp`              | Lease expiration timestamp                          |
| `idempotency_key` | `text UNIQUE`            | Deduplication key                                   |
| `available_at`    | `timestamp`              | Earliest time eligible for processing               |
| `attempts`        | `integer DEFAULT 0`      | Execution attempt count                             |
| `started_at`      | `timestamp`              | Start timestamp of current attempt                  |
| `completed_at`    | `timestamp`              | Completion timestamp                                |
| `last_error`      | `text`                   | Captured error message                              |
| `created_at`      | `timestamp`              | Creation timestamp                                  |
| `updated_at`      | `timestamp`              | Last update timestamp                               |

---

## ⚙️ Setup & Running with `npm`

### 1. Prerequisites

- **Node.js**: `v20.x` or higher
- **PostgreSQL**: `v14.x` or higher
- **Package Manager**: `npm` (v10+)

### 2. Installation

```bash
git clone https://github.com/your-org/beastMQ.git
cd beastMQ
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Configure `.env`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beastmq?sslmode=disable"
PORT=3000
CONCURRENCY=5
MIN_POLL_DELAY=100
MAX_POLL_DELAY=5000
JOB_TIMEOUT=30000
LEASE_DURATION_MS=300000
```

### 4. Database Migrations

```bash
# Push schema directly
npm run db:push

# Or run versioned migrations
npm run db:generate
npm run db:migrate
```

### 5. Start Server & Workers

```bash
# Start API Server (Development)
npm run dev

# Start API Server (Production)
npm run build
npm start

# Start Background Worker
npm run worker
```

---

## 🧪 Testing & Verification

beastMQ includes comprehensive integration tests verifying queue durability, crash recovery, and agentic workflows:

```bash
# 1. Run all core queue resilience tests (Crash, Timeout, Idempotency, DLQ, Shutdown, Priority)
npm test

# 2. Run the agentic capabilities test suite (Subagents, Results, Handlers, Replay)
npm run test:agent

# 3. Test the CLI interface
npm run cli help
```

---

## 📂 Modular Architecture & Structure

```text
beastMQ/
├── skills/                    # 🌐 Open Agent Skills Standard (skills.sh)
│   └── beastmq/
│       ├── SKILL.md           # Universal Agent Skill definition
│       └── references/        # API and agentic workflow patterns
├── SKILL.md                   # Root skill entrypoint (for `npx skills add .`)
├── .agents/skills/beastmq/    # Workspace skill discovery for Antigravity
├── src/
│   ├── core/                  # ⚙️ Core Queue Primitives
│   │   ├── types.ts           # JobRecord, EnqueueJobInput, JobStatus
│   │   ├── claim.ts           # Atomic SELECT ... FOR UPDATE SKIP LOCKED
│   │   ├── lease.ts           # Lease duration & heartbeat renewer
│   │   ├── idempotency.ts     # Distributed idempotency key state machine
│   │   └── retry.ts           # Exponential backoff & DLQ routing
│   ├── agent/                 # 🧠 Agentic Execution Layer
│   │   ├── context.ts         # AgentTaskContext (traceId, parentJobId, agentRole)
│   │   ├── registry.ts        # Task & Tool Handler Registry (taskRegistry)
│   │   ├── executor.ts        # Agent Task Runner & timeout watchdog
│   │   ├── workflow.ts        # Subagent task spawning & trace queries
│   │   └── client.ts          # BeastMQClient SDK (enqueue, wait, subagents)
│   ├── api/                   # 🌐 HTTP API Layer
│   │   ├── routes/            # /jobs, /dead-jobs, /agent/tasks
│   │   └── app.ts             # Express app composition & route mounting
│   ├── worker/                # 🛠️ Worker Engine & Daemons
│   │   ├── runner.ts          # Concurrent fiber pool & adaptive backoff
│   │   └── shutdown.ts        # Graceful signal listeners (SIGINT, SIGTERM, IPC)
│   ├── cli/                   # 💻 CLI Layer (`npx beastmq`)
│   │   └── index.ts           # Command parser (enqueue, wait, status, dlq, worker)
│   ├── db/                    # 🗄️ Database & Schema Layer
│   │   ├── index.ts           # PostgreSQL pool & Drizzle ORM client
│   │   └── schema.ts          # jobs, dead_jobs, idempotency_keys
│   ├── server.ts              # HTTP server daemon entrypoint
│   ├── worker.ts              # Worker process daemon entrypoint
│   └── index.ts               # Main package exports (SDK, Registry, Core Types)
├── tests/
│   ├── run_tests.ts           # Core queue resilience tests (1 to 7)
│   ├── test_agent_layer.ts    # Agentic layer integration tests (SDK, subagents, DLQ)
│   └── test_db.ts             # Database constraints inspection utility
├── drizzle/                   # Drizzle ORM migration snapshots and SQL
├── .env.example               # Sample environment configuration template
├── package.json               # NPM scripts, binary definition (`beastmq`), dependencies
└── tsconfig.json              # TypeScript compiler settings (NodeNext, Strict)
```

---

## 📄 License

This project is licensed under the [ISC License](file:///C:/Users/abhin/OneDrive/Desktop/Explore/beastMQ/package.json).
