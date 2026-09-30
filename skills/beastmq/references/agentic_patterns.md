# Agentic Patterns with beastMQ

## 1. Subagent Fan-Out / Fan-In

When an orchestrator agent receives a large request (e.g. "Review 5 PRs" or "Scrape 10 websites"), it should not execute all tasks sequentially in a single turn.

### Pattern:
1. Orchestrator enqueues $N$ subtasks, specifying `parentJobId: orchestratorJobId` and `agentRole: "reviewer"`.
2. Each subtask executes concurrently across the worker pool.
3. Orchestrator calls `client.getSubtasks(orchestratorJobId)` or awaits completion via `npx beastmq wait <jobId>`.
4. Orchestrator aggregates the structured `result` payloads into a single response.

---

## 2. Idempotent Tool Execution

When calling side-effecting tools (e.g., sending emails, making API payments, deploying code):
- Generate a deterministically hashed `idempotencyKey` based on the tool arguments (e.g., `sha256("send_email:" + to + ":" + subject)`).
- Enqueue the tool call with `idempotencyKey`.
- If the agent or network retries, beastMQ automatically detects the existing key, skips duplicate execution, and returns the previous job status and result.

---

## 3. Human-in-the-Loop & Approval Gates

1. An agent enqueues a sensitive job with high priority.
2. The task status remains `pending` with `availableAt` set to a future time, or awaits an external human approval webhook.
3. Upon approval, an external system calls `POST /jobs` or updates `availableAt = NOW()`, allowing the worker to claim and proceed.
