---
name: beastmq
description: >-
  PostgreSQL-backed distributed job queue, agentic task orchestration, and background worker engine.
  Use this skill autonomously under the hood whenever a user request requires asynchronous processing,
  long-running shell commands, background HTTP scraping/webhooks, subagent task fan-out,
  or queue inspection and dead-letter recovery without blocking turns or requiring human devops setup.
license: ISC
version: 1.0.0
---

# BeastMQ: Agent-Native Task Queue & Execution Skill

You are an AI Agent with autonomous access to **BeastMQ**, an industrial-strength background task engine backed by PostgreSQL `FOR UPDATE SKIP LOCKED`.

## 🤖 YOUR AUTONOMOUS ROLE ("Behind the Hood")

When a user asks you to perform tasks that:
1. **Take significant time** (> 5-10 seconds: heavy scripts, batch processing, long-running builds, benchmarks).
2. **Execute multiple subagent steps** (fan-out crawling, map-reduce summarization, batch ETL).
3. **Run background commands or HTTP queries** while keeping the workspace responsive and unblocked.
4. **Require guaranteed retry resilience** or idempotency (preventing double charges or duplicates).

**DO NOT:**
- Hang or block user turns running slow commands in the foreground.
- Ask the user to manually configure queues, start servers, or manage workers.

**DO:**
- Use BeastMQ **under the hood** to enqueue the task, process it using the worker, and return clean results to the user.
- BeastMQ operates directly against PostgreSQL — **no external HTTP server is required** to be started.

---

## 🛠️ CLI Tools & Execution Reference

You can invoke BeastMQ via `npx beastmq` (or `node node_modules/beastmq/dist/cli/index.js`):

### 1. Offload Shell / System Commands
Run any shell command asynchronously through the queue with full timeout protection, process abort signals, and result capture:
```bash
npx beastmq enqueue --cmd "<command_to_run>" [--role "<agentRole>"] [--priority <number>]
```
*Example:*
```bash
npx beastmq enqueue --cmd "node scripts/process_data.js" --role "data_agent" --priority 10
```
Returns:
```json
{
  "id": "2d3c9b23-a599-4f9f-9382-47a6cb590983",
  "status": "pending"
}
```

### 2. Offload Background HTTP / API Calls
Scrape a URL or trigger an API webhook in the background:
```bash
npx beastmq enqueue --url "<url>" [--method GET|POST] [--role "<agentRole>"]
```
*Example:*
```bash
npx beastmq enqueue --url "https://api.github.com/zen" --role "api_agent"
```

### 3. Enqueue Subagent Tasks (Parent-Child Hierarchy)
Coordinate subagents by linking tasks with `--parent-id` and `--trace-id`:
```bash
npx beastmq enqueue \
  --type "agent.subtask" \
  --payload '{"chunk": 2, "query": "summarize"}' \
  --parent-id "2d3c9b23-a599-4f9f-9382-47a6cb590983" \
  --role "summarizer_subagent" \
  --trace-id "session_44"
```

### 4. Process Tasks with the Worker
- **One-Shot Execution (Drain Mode)**:
  Processes all queued jobs until the queue is completely drained, then exits cleanly (ideal for running in a tool call):
  ```bash
  npx beastmq worker --drain
  ```
- **Daemon Mode (Background Worker)**:
  Launches a persistent background worker with configurable concurrency:
  ```bash
  npx beastmq worker --concurrency 5
  ```

### 5. Inspect Results & Monitor Progress
- **Wait for Completion**:
  ```bash
  npx beastmq wait <jobId> --timeout 30000
  ```
- **Check Status & Output**:
  ```bash
  npx beastmq status <jobId>
  ```
  Returns status, timings, attempts, and the structured `result` payload (stdout, stderr, exit code, duration).

### 6. Inspect & Recover Dead-Letter Queue (DLQ)
- **List failed tasks**:
  ```bash
  npx beastmq dlq list
  ```
- **Replay failed task**:
  ```bash
  npx beastmq dlq replay <deadJobId>
  ```

---

## 💻 Programmatic Agent SDK (TypeScript / Node.js)

If writing code inside the application:

```typescript
import { BeastMQClient, taskRegistry } from "beastmq";

const client = new BeastMQClient();

// 1. Register an Agent Task Handler
taskRegistry.register("agent.web_research", async (payload: { url: string }, context) => {
  // context contains: jobId, traceId, parentJobId, agentRole, attempts, signal
  const pageData = await fetch(payload.url, { signal: context.signal }).then((r) => r.text());
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

## ⚡ The Behind-the-Hood Workflow

When executing user requests:
1. **Analyze**: Break down the user's workload into BeastMQ tasks.
2. **Enqueue**: Run `npx beastmq enqueue ...` to create the jobs.
3. **Execute**: Run `npx beastmq worker --drain` to process the jobs (or let the background worker handle it).
4. **Inspect**: Run `npx beastmq status <jobId>` to fetch output (`result`).
5. **Synthesize**: Format and present the final answer clearly to the human user without devops noise.

---

## 🔄 Core Agentic Patterns & References

- [API & Schema Reference](../../../skills/beastmq/references/api.md)
- [Agentic Workflow Patterns](../../../skills/beastmq/references/agentic_patterns.md)
