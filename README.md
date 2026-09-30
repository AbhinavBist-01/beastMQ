# ⚡ beastMQ

A production-grade, distributed message queue and asynchronous background job execution engine backed entirely by **PostgreSQL**. Engineered with TypeScript, Node.js, Express, and Drizzle ORM, beastMQ provides mission-critical reliability, strict priority scheduling, distributed idempotency guarantees, lease-based crash recovery, and dead-letter queue (DLQ) isolation.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Why beastMQ?](#-why-beastmq)
- [Key Features](#-key-features)
- [System Architecture & Flow](#-system-architecture--flow)
- [Job Lifecycle State Machine](#-job-lifecycle-state-machine)
- [Database Schema & Data Model](#-database-schema--data-model)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Migrations](#database-migrations)
- [Running the System](#-running-the-system)
  - [HTTP API Server](#http-api-server)
  - [Background Worker](#background-worker)
- [HTTP API Reference](#-http-api-reference)
  - [Enqueue a Job (`POST /jobs`)](#enqueue-a-job-post-jobs)
- [Worker Engine Internals](#-worker-engine-internals)
  - [Atomic Job Claiming (`FOR UPDATE SKIP LOCKED`)](#atomic-job-claiming-for-update-skip-locked)
  - [Lease-Based Locking & Heartbeat Mechanism](#lease-based-locking--heartbeat-mechanism)
  - [Crash Recovery & Fault Tolerance](#crash-recovery--fault-tolerance)
  - [Distributed Idempotency Protocol](#distributed-idempotency-protocol)
  - [Exponential Backoff Retries & DLQ](#exponential-backoff-retries--dlq)
  - [Adaptive Polling Engine](#adaptive-polling-engine)
  - [Graceful Shutdown](#graceful-shutdown)
- [Testing & Verification Suite](#-testing--verification-suite)
- [Production Deployment & Tuning](#-production-deployment--tuning)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## 🔭 Architectural Overview

Message queues typically require standalone infrastructure such as Redis, RabbitMQ, or Apache Kafka. While powerful, introducing external queue brokers adds operational overhead, consistency mismatches, and dual-write problems.

**beastMQ** leverages PostgreSQL's native row-level lock primitives (`FOR UPDATE SKIP LOCKED`) to turn PostgreSQL into a rock-solid, transactional queueing system. By keeping jobs and your primary application data in the same ACID-compliant database, you achieve:
- **Zero Two-Phase Commits / Outbox Compatibility**: Enqueue jobs atomically within your business logic transactions.
- **Strict Durability**: Every job enqueue, transition, and retry is backed by WAL (Write-Ahead Logging).
- **Zero Lock Contention**: Workers claim jobs without blocking or colliding with concurrent workers.

---

## 🎯 Why beastMQ?

| Feature | beastMQ (PostgreSQL) | Traditional In-Memory (Redis/BullMQ) | External Brokers (RabbitMQ/Kafka) |
| :--- | :--- | :--- | :--- |
| **Storage & Durability** | ACID, WAL-backed PostgreSQL tables | RAM (RDB/AOF persistence optional) | Broker log / Mnesia store |
| **Operational Overhead** | 0 new infrastructure required | Dedicated Redis cluster required | Dedicated broker cluster & zoo |
| **Atomic Outbox Enqueue** | ✅ Native within existing DB tx | ❌ Requires outbox table + CDC relayer | ❌ Requires outbox table + Debezium |
| **Crash Safety** | ✅ Heartbeat & lease-expiration recovery | ⚠️ Partial (depends on stalled intervals) | ✅ ACK / consumer lease timeouts |
| **Idempotency Tracking** | ✅ Distributed DB-level deduplication | ⚠️ TTL-based key checks | ⚠️ Application-level or Redis cache |
| **Payload Queryability** | ✅ Native SQL & JSONB queries | ❌ Opaque or custom Redis scripting | ❌ Custom schema registries |

---

## ✨ Key Features

- **Non-Blocking Atomic Claims**: Uses PostgreSQL `FOR UPDATE SKIP LOCKED` inside serializable/read-committed transactions to pull the highest priority job instantly with zero concurrency collisions.
- **Priority-First FIFO Scheduling**: Jobs are prioritized by `priority DESC` and ordered by insertion timestamp `created_at ASC`.
- **Worker Crash Recovery (Lease Model)**: Jobs hold time-bounded leases (`locked_until`). If a worker experiences a hard crash (OOM, SIGKILL, server termination), the lease expires and another worker immediately reclaims and completes the task.
- **Liveness Heartbeats**: Long-running jobs automatically emit heartbeats every 10 seconds to renew their execution lease.
- **Distributed Idempotency (Dual-Layered)**:
  - **Producer level**: Unique constraints prevent duplicate submissions on the HTTP boundary.
  - **Consumer level**: Dedicated distributed lock table (`idempotency_keys`) tracks processing state across concurrent workers to prevent duplicate processing.
- **Exponential Backoff**: Transient failures automatically reschedule jobs with delays scaled exponentially: $T = 1000 \times 2^{\text{attempt} - 1}$ ms.
- **Dead-Letter Queue (DLQ)**: Jobs failing beyond maximum threshold (5 attempts) are automatically preserved in the `dead_jobs` audit table with the stack trace and original payload.
- **Execution Timeout Watchdog**: Enforces per-job hard timeouts using `Promise.race` to prevent hanging tasks.
- **Adaptive Polling Delay**: Fibers dynamically scale idle delays from `MIN_POLL_DELAY` (100ms) up to `MAX_POLL_DELAY` (5000ms), dropping immediately back to minimum delay when new tasks arrive.
- **Graceful Shutdown**: Intercepts `SIGINT`, `SIGTERM`, IPC, and STDIN signals to drain active running jobs before terminating.

---

## 🏗️ System Architecture & Flow

```mermaid
flowchart TD
    subgraph Producers ["Client & Producers"]
        Client[HTTP Clients / Microservices] -->|POST /jobs| API[Express API Server]
    end

    subgraph PostgreSQL ["PostgreSQL Database (ACID Engine)"]
        JobsTable[("jobs Table\n(status: pending | running | completed | dead)")]
        IdempotencyTable[("idempotency_keys Table\n(distributed lock & dedup)")]
        DLQTable[("dead_jobs Table\n(DLQ Archive)")]
    end

    subgraph Workers ["beastMQ Worker Engine"]
        WPool["Worker Process (Concurrency Fibers: 1..N)"]
        Claim["SELECT FOR UPDATE SKIP LOCKED\n(priority DESC, created_at ASC)"]
        Runner["Job Handler Execution (Promise.race Timeout)"]
        Heartbeat["Background Heartbeat Timer (Every 10s)"]
    end

    API -->|1. Insert Job (Unique idempotencyKey)| JobsTable
    API -.->|Duplicate Key Response| Client

    WPool --> Claim
    Claim -->|2. Atomic Claim & Lease| JobsTable
    Claim -->|3. Acquire Idempotency Lease| IdempotencyTable

    WPool --> Runner
    Runner --> Heartbeat
    Heartbeat -->|Renew locked_until lease| JobsTable
    Heartbeat -->|Renew locked_until lease| IdempotencyTable

    Runner -->|Success| Completed[Mark status = completed]
    Completed --> JobsTable
    Completed --> IdempotencyTable

    Runner -->|Failure < 5 attempts| Backoff[Exponential Backoff: status = pending]
    Backoff --> JobsTable

    Runner -->|Failure >= 5 attempts| Poison[Archive to dead_jobs & status = dead]
    Poison --> DLQTable
    Poison --> JobsTable
```

---

## 🔄 Job Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> pending: POST /jobs

    pending --> running: Claimed via FOR UPDATE SKIP LOCKED
    
    state running {
        [*] --> Executing
        Executing --> HeartbeatLoop: Interval 10s extends lease
        Executing --> TimeoutWatchdog: Exceeds JOB_TIMEOUT
    }

    running --> completed: Success
    running --> pending: Transient failure (Attempts < 5) + Exponential Backoff
    running --> dead: Fatal failure (Attempts >= 5) -> Archived to dead_jobs
    running --> pending: Worker Crashes & Lease (locked_until) Expires

    completed --> [*]
    dead --> [*]
```

---

## 🗄️ Database Schema & Data Model

beastMQ is modeled using [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL native types.

### 1. `jobs` Table
Core work queue containing all pending, running, completed, and dead-lettered jobs.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `gen_random_uuid()` | Unique job identifier |
| `type` | `varchar(255)` | `NOT NULL` | Job routing type (e.g., `email.send`, `payment`) |
| `priority` | `integer` | `NOT NULL`, `DEFAULT 0` | Priority weighting (higher claims first) |
| `payload` | `jsonb` | `NOT NULL` | Structured input payload for execution |
| `status` | `text` | `NOT NULL`, `DEFAULT 'pending'` | Current status: `pending`, `running`, `completed`, `dead` |
| `locked_by` | `text` | `NULLABLE` | UUID of the active worker node holding lease |
| `locked_until` | `timestamp` | `NULLABLE` | Expiration timestamp of the current worker lease |
| `idempotency_key`| `text` | `UNIQUE`, `NULLABLE` | Deduplication key for producer & worker guarantees |
| `available_at` | `timestamp` | `NOT NULL`, `DEFAULT now()` | Timestamp when the job is eligible for processing (used for backoff delays) |
| `attempts` | `integer` | `NOT NULL`, `DEFAULT 0` | Total execution attempts consumed |
| `started_at` | `timestamp` | `NULLABLE` | Timestamp when current/last attempt began |
| `completed_at` | `timestamp` | `NULLABLE` | Timestamp when job transitioned to `completed` |
| `last_error` | `text` | `NULLABLE` | Last captured error message or stack trace |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT now()` | Ingestion timestamp |
| `updated_at` | `timestamp` | `NOT NULL`, `DEFAULT now()` | Last record modification timestamp |

### 2. `dead_jobs` Table
Dead Letter Queue (DLQ) preserving failed jobs for post-mortem forensics and manual replay.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `gen_random_uuid()` | Unique record ID in DLQ |
| `job_id` | `uuid` | `NOT NULL` | Pointer to original `jobs.id` |
| `type` | `text` | `NOT NULL` | Original job routing type |
| `payload` | `jsonb` | `NOT NULL` | Full original payload |
| `attempts` | `integer` | `NOT NULL` | Execution count reached before termination (typically `5`) |
| `error` | `text` | `NULLABLE` | Terminal error message or trace |
| `failed_at` | `timestamp` | `NOT NULL`, `DEFAULT now()` | Timestamp of archive event |

### 3. `idempotency_keys` Table
Distributed lock and state tracker for consumer-side at-most-once/exactly-once processing semantics.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `key` | `text` | `PRIMARY KEY` | Globally unique idempotency key |
| `status` | `text` | `NOT NULL`, `DEFAULT 'processing'` | Lifecycle state: `processing` or `completed` |
| `result` | `jsonb` | `NULLABLE` | Cached operation result (if applicable) |
| `locked_by` | `text` | `NULLABLE` | Worker UUID holding the execution lease |
| `locked_until` | `timestamp` | `NULLABLE` | Lease expiration for crashed worker reclamation |
| `created_at` | `timestamp` | `NOT NULL`, `DEFAULT now()` | Key creation timestamp |
| `updated_at` | `timestamp` | `NOT NULL`, `DEFAULT now()` | Key modification timestamp |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher (ESM native)
- **PostgreSQL**: `v14.x` or higher (supports `SKIP LOCKED` and `gen_random_uuid()`)
- **Package Manager**: `pnpm` (recommended), `npm`, or `yarn`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/beastMQ.git
cd beastMQ
pnpm install
```

### Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Edit `.env` to match your local or cloud PostgreSQL credentials:

```dotenv
# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beastmq?sslmode=disable"

# HTTP Ingestion Server Port
PORT=3000

# Worker Process Tuning
CONCURRENCY=5
MIN_POLL_DELAY=100
MAX_POLL_DELAY=5000
JOB_TIMEOUT=30000
LEASE_DURATION_MS=300000
```

### Database Migrations

Apply database migrations to provision schemas:

```bash
# Push schema directly (development / prototyping)
pnpm run db:push

# Or generate and run version-controlled migrations (production)
pnpm run db:generate
pnpm run db:migrate
```

---

## ⚙️ Running the System

### HTTP API Server

Start the ingestion REST API server:

```bash
# Development (with auto-reload via tsx)
pnpm run dev

# Production
pnpm run build
pnpm run start
```

Default output:
```text
Server is running on port 3000
```

### Background Worker

Spawn a background worker instance to process queue jobs:

```bash
# Start background worker
pnpm run worker
```

Worker console output:
```text
Worker 5b157405-b040-410a-8bf8-d9d1fe72c8ea started
Worker 5b157405-b040-410a-8bf8-d9d1fe72c8ea started with concurrency 5. Listening for jobs...
```

---

## 📡 HTTP API Reference

### Enqueue a Job (`POST /jobs`)

Submits a new job into the queue.

#### Request

- **Endpoint**: `POST /jobs`
- **Headers**: `Content-Type: application/json`
- **Body Schema**:

```json
{
  "type": "string (required) - Job type identifier",
  "payload": "object | any (required) - Arbitrary JSON payload",
  "priority": "number (optional, default: 0) - Priority weighting (higher = processed sooner)",
  "idempotencyKey": "string (optional) - Unique key to guarantee deduplication"
}
```

#### Example cURL: Standard Job

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.send_welcome",
    "payload": {
      "userId": "usr_99812",
      "email": "user@example.com",
      "template": "onboarding_v2"
    },
    "priority": 10
  }'
```

**Response (`201 Created`):**
```json
{
  "id": "18a4a523-8bc6-46f9-b88a-ea4c5eb44509",
  "status": "pending"
}
```

#### Example cURL: Idempotent Payment Job

```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "billing.charge_subscription",
    "payload": {
      "customerId": "cust_456",
      "amountCents": 4900
    },
    "priority": 100,
    "idempotencyKey": "charge_cust456_2026_09"
  }'
```

**First Call Response (`201 Created`):**
```json
{
  "id": "d04018d9-3e5e-4bb6-bc34-31ea67b36fcf",
  "status": "pending"
}
```

**Subsequent Duplicate Request Response (`200 OK`):**
```json
{
  "id": "d04018d9-3e5e-4bb6-bc34-31ea67b36fcf",
  "status": "running",
  "duplicate": true
}
```

---

## 🧠 Worker Engine Internals

### Atomic Job Claiming (`FOR UPDATE SKIP LOCKED`)

Concurrency conflicts are eliminated at the database engine level. When a worker thread seeks work, it issues an atomic transaction:

```sql
SELECT * FROM jobs
WHERE (status = 'pending' AND available_at <= NOW())
   OR (status = 'running' AND locked_until < NOW())
ORDER BY priority DESC, created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

#### Key Mechanics:
1. `FOR UPDATE`: Locks selected rows in the transaction buffer.
2. `SKIP LOCKED`: Any row currently locked by another worker process is skipped immediately without waiting or blocking.
3. `priority DESC, created_at ASC`: Strictly guarantees priority scheduling, falling back to FIFO order for jobs of identical priority.
4. Atomically transitions the claimed job status to `running`, increments `attempts = attempts + 1`, and writes `locked_by = workerId` and `locked_until = NOW() + LEASE_DURATION_MS`.

---

### Lease-Based Locking & Heartbeat Mechanism

Every claimed job is leased for `LEASE_DURATION_MS` (default: 5 minutes / 300,000 ms). 

- **Automatic Heartbeat**: For active jobs, the worker starts a background heartbeat interval (`setInterval` every 10,000 ms) via [worker.ts](file:///C:/Users/abhin/OneDrive/Desktop/Explore/beastMQ/src/worker.ts).
- Every heartbeat tick extends `locked_until` by another 5 minutes in both the `jobs` and `idempotency_keys` tables.
- Once the job handler finishes, the heartbeat is unconditionally cleared in the `finally` block.

---

### Crash Recovery & Fault Tolerance

If a worker node crashes (e.g. EC2 instance termination, Kubernetes OOM kill, unhandled hardware failure):

1. The crashed worker ceases emitting heartbeats.
2. The job remains in `status = 'running'` with its lease timestamp fixed at `locked_until`.
3. When `NOW() > locked_until`, the claim query detects:
   ```sql
   (status = 'running' AND locked_until < NOW())
   ```
4. A healthy peer worker seamlessly claims the abandoned job, restarts execution, increments the attempt count, and finishes the task.

---

### Distributed Idempotency Protocol

To prevent duplicate execution across distributed workers, [worker.ts](file:///C:/Users/abhin/OneDrive/Desktop/Explore/beastMQ/src/worker.ts) implements an atomic idempotency state machine in `acquireIdempotencyKey`:

1. **Claim**: Attempts to insert the key with `status = 'processing'` and `locked_until = NOW() + LEASE_DURATION_MS` using `ON CONFLICT DO NOTHING`.
2. **Completed**: If the key already exists and has `status = 'completed'`, the worker marks the duplicate job as `completed` immediately and skips re-execution.
3. **Active Processing**: If another worker currently holds an unexpired lease (`status = 'processing' AND locked_until > NOW()`), the current job yields and resets status to `pending`.
4. **Reclaim**: If the holding worker crashed (`status = 'processing' AND locked_until < NOW()`), the current worker reclaims ownership and executes the task.
5. **Success Finalization**: Upon completion, the idempotency record status transitions to `completed`.

---

### Exponential Backoff Retries & DLQ

When an unhandled exception or timeout occurs inside a job handler:

1. **Retry Calculation**:
   $$\text{Delay} = 1000 \times 2^{(\text{attempts} - 1)} \text{ ms}$$
   - Attempt 1 failure $\rightarrow$ Retry after 1,000 ms (1s)
   - Attempt 2 failure $\rightarrow$ Retry after 2,000 ms (2s)
   - Attempt 3 failure $\rightarrow$ Retry after 4,000 ms (4s)
   - Attempt 4 failure $\rightarrow$ Retry after 8,000 ms (8s)
2. **Reschedule**: The job is reset to `status = 'pending'` with `available_at = NOW() + delay`. Workers ignore this job until `available_at <= NOW()`.
3. **Dead Letter Queue (DLQ)**: Once `attempts >= 5`:
   - The job is inserted into `dead_jobs` with full payload, attempt count, and error trace.
   - The primary job record is marked `status = 'dead'` and `last_error = error.message`.

---

### Adaptive Polling Engine

To conserve CPU cycles and database bandwidth when queues are idle:
- When a worker finds and processes a job, its delay resets to `MIN_POLL_DELAY` (100ms).
- When no jobs are available, the worker executes exponential backoff sleep:
  $$\text{delay} = \min(\text{delay} \times 2, \text{MAX\_POLL\_DELAY})$$
  (scales from 100ms up to 5,000ms).

---

### Graceful Shutdown

beastMQ is designed for cloud-native orchestration (Kubernetes, AWS ECS, Docker Swarm):

- Workers listen for termination signals (`SIGINT`, `SIGTERM`, Node.js IPC messages, and stdin `"shutdown"`).
- Sets `shuttingDown = true`.
- Workers stop polling for new jobs immediately.
- In-flight jobs are allowed to complete execution, update the database, and cleanly disconnect connection pools before process termination.

---

## 🧪 Testing & Verification Suite

beastMQ includes an automated end-to-end integration test harness in [tests/run_tests.ts](file:///C:/Users/abhin/OneDrive/Desktop/Explore/beastMQ/tests/run_tests.ts) testing real PostgreSQL instances and actual worker subprocesses.

### Test Scenarios Covered

| # | Test Case | Validated Behavior |
| :-: | :--- | :--- |
| **1** | **Worker Crash Recovery** | Spawns Worker A, kills it mid-job, validates lease expiration, and confirms Worker B reclaims and finishes the job. |
| **2** | **Job Execution Timeout** | Verifies jobs exceeding `JOB_TIMEOUT` are aborted via `Promise.race` and rescheduled with backoff. |
| **3** | **Duplicate Idempotency** | Confirms identical idempotency keys reject duplicate inserts and bypass re-execution. |
| **4** | **Multi-Worker Concurrency** | Spawns multiple workers with multiple fibers concurrently; confirms zero race conditions or collisions. |
| **5** | **Retry $\rightarrow$ Dead Letter Queue** | Forces 5 consecutive failures, verifies exponential retry progression and final archival into `dead_jobs`. |
| **6** | **Graceful Shutdown** | Emits shutdown signal while jobs run; verifies active jobs finish while newly arriving jobs remain pending. |
| **7** | **Priority Claiming Order** | Enqueues low and high priority jobs; proves high priority jobs are claimed first regardless of age. |

### Running the Tests

```bash
# Run all integration tests
pnpm test
# or: npx tsx tests/run_tests.ts

# Run an individual test scenario (e.g. Test 1: Worker Crash)
pnpm test 1

# Run Test 5 (Retry -> DLQ)
pnpm test 5
```

---

## 🛠️ Production Deployment & Tuning

### 1. Optimal Database Indexing

For high-throughput environments processing millions of jobs, apply the following composite indexes:

```sql
-- Accelerated job claiming index
CREATE INDEX idx_jobs_claim ON jobs (priority DESC, created_at ASC)
WHERE status IN ('pending', 'running');

-- Fast availability lookup for backoff retries
CREATE INDEX idx_jobs_availability ON jobs (available_at)
WHERE status = 'pending';

-- Idempotency lookup index (already backed by UNIQUE constraint)
CREATE INDEX idx_jobs_idempotency ON jobs (idempotency_key)
WHERE idempotency_key IS NOT NULL;
```

### 2. PostgreSQL Connection Pool Tuning

In [src/db/index.ts](file:///C:/Users/abhin/OneDrive/Desktop/Explore/beastMQ/src/db/index.ts), configure the PostgreSQL client pool based on worker concurrency:

$$\text{max\_connections} \ge (\text{Worker Processes} \times \text{CONCURRENCY}) + \text{API Connections} + 5$$

```typescript
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                       // Adjust to concurrency requirements
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

### 3. Autovacuum Optimization

Because message queue tables experience frequent updates and deletes:

```sql
ALTER TABLE jobs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_vacuum_cost_limit = 500
);
```

---

## 📂 Project Structure

```text
beastMQ/
├── drizzle/                   # Drizzle ORM migration snapshots and SQL
│   ├── 0000_woozy_anthem.sql
│   └── ...
├── src/
│   ├── db/
│   │   ├── index.ts          # PostgreSQL pool & Drizzle ORM client initialization
│   │   └── schema.ts         # Table definitions (jobs, deadJobs, idempotencyKeys)
│   ├── app.ts                # Express application and HTTP job endpoints
│   ├── server.ts             # HTTP server entrypoint
│   └── worker.ts             # Core worker polling, heartbeat, retry & claim engine
├── tests/
│   ├── run_tests.ts          # E2E integration test suite (7 comprehensive test scenarios)
│   └── test_db.ts            # Database constraints inspection utility
├── .env.example              # Sample environment configuration template
├── drizzle.config.js         # Drizzle Kit CLI configuration
├── package.json              # NPM scripts, dependencies, engine definitions
└── tsconfig.json             # TypeScript compiler settings (NodeNext, Strict)
```

---

## 📄 License

This project is licensed under the [ISC License](file:///C:/Users/abhin/OneDrive/Desktop/Explore/beastMQ/package.json).
