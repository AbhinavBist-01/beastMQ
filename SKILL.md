---
name: beastmq
description: >-
  Asynchronous background task queue, agentic workflow orchestration, and worker execution engine backed by PostgreSQL.
  Use this skill when an AI agent needs to offload long-running operations, coordinate subagent tasks, prevent timeouts,
  ensure distributed idempotency, or inspect and recover failed queue tasks.
license: ISC
version: 1.0.0
---

# beastMQ: Agentic Task Queue & Execution Skill

`beastMQ` is a production-grade, distributed message queue and agentic task orchestration engine backed by PostgreSQL row-level locks (`FOR UPDATE SKIP LOCKED`). It gives AI agents a persistent, ACID-durable asynchronous layer to delegate heavy computations, schedule background subagents, guarantee idempotency, and wait for structured results without blocking agent turns.

---

## 🧭 When to Use This Skill

Activate this skill when:
- **Offloading Long Operations**: An agent needs to trigger a long-running computation (data scraping, model training, video processing, bulk API calls) that would otherwise exceed tool/turn timeouts.
- **Subagent Delegation**: A primary agent needs to spawn one or more asynchronous child subtasks (`parentJobId`, `traceId`, `agentRole`) and collect results asynchronously.
- **Distributed Idempotency**: An agent must ensure an operation (such as payment processing, database migrations, or email delivery) is executed at most once despite retries.
- **Fault Recovery**: Inspecting failed jobs in the Dead Letter Queue (DLQ) and replaying them after debugging.

---

## ⚡ Quickstart Commands (CLI)

Agents with shell/terminal execution capabilities can directly run `npx beastmq`:

### 1. Enqueue an Agent Task
```bash
npx beastmq enqueue \
  --type "agent.data_analysis" \
  --payload '{"datasetId": "ds_102", "metrics": ["mean", "variance"]}' \
  --priority 10 \
  --role "data_analyst" \
  --trace-id "session_881"
```
**Output:**
```json
{
  "id": "7b520d8e-88d5-44e3-9d30-09b128f3d96a",
  "status": "pending"
}
```

### 2. Spawn a Subagent Task (Parent-Child)
```bash
npx beastmq enqueue \
  --type "agent.summarize" \
  --payload '{"chunkIndex": 1}' \
  --parent-id "7b520d8e-88d5-44e3-9d30-09b128f3d96a" \
  --role "summarizer_subagent"
```

### 3. Wait for Task Result
```bash
npx beastmq wait 7b520d8e-88d5-44e3-9d30-09b128f3d96a --timeout 30000
```
**Output:**
```json
{
  "id": "7b520d8e-88d5-44e3-9d30-09b128f3d96a",
  "status": "completed",
  "result": {
    "summary": "Processed 10,000 rows successfully.",
    "insights": ["Anomaly detected in column B"]
  }
}
```

### 4. Check Task Status
```bash
npx beastmq status 7b520d8e-88d5-44e3-9d30-09b128f3d96a
```

### 5. Inspect & Replay Dead Letter Queue (DLQ)
```bash
# List permanently failed tasks
npx beastmq dlq list

# Replay a failed dead job back into pending state
npx beastmq dlq replay 4b2c394f-61aa-402f-82c7-8f587482e27b
```

---

## 💻 Programmatic Agent SDK (TypeScript)

If writing code inside the application:

```typescript
import { BeastMQClient, taskRegistry } from "beastmq";

const client = new BeastMQClient();

// 1. Register an Agent Task Handler
taskRegistry.register("agent.web_research", async (payload: { url: string }, context) => {
  // context contains: jobId, traceId, parentJobId, agentRole, attempts
  const pageData = await fetch(payload.url).then(r => r.text());
  return { length: pageData.length, fetchedAt: new Date().toISOString() };
});

// 2. Enqueue task
const job = await client.enqueue({
  type: "agent.web_research",
  payload: { url: "https://example.com" },
  traceId: "research-session-1",
  agentRole: "researcher",
  priority: 5,
});

// 3. Await result
const completed = await client.waitForJob(job.id, { timeoutMs: 15_000 });
console.log("Result:", completed.result);
```

---

## 🔄 Core Agentic Patterns

For advanced subagent fan-out patterns and failure recovery protocols, refer to:
- [API & Schema Reference](./skills/beastmq/references/api.md)
- [Agentic Workflow Patterns](./skills/beastmq/references/agentic_patterns.md)
