# beastMQ API & Schema Reference

## HTTP Endpoints

### 1. `POST /jobs`
Submits a background job or agent task.

**Headers:** `Content-Type: application/json`

**Body Schema:**
```json
{
  "type": "string (required) - Task type identifier",
  "payload": "any (required) - Structured JSON payload",
  "priority": "number (optional, default: 0) - Priority order (higher claims sooner)",
  "idempotencyKey": "string (optional) - Unique deduplication key",
  "traceId": "string (optional) - Correlation ID for conversation/trace session",
  "parentJobId": "string (optional) - UUID of parent job if spawned by subagent",
  "agentRole": "string (optional) - Role label (e.g. 'coder', 'researcher')"
}
```

**Responses:**
- `201 Created`: `{ "id": "uuid", "status": "pending" }`
- `200 OK`: `{ "id": "uuid", "status": "running|completed", "duplicate": true }` (Idempotent replay)
- `400 Bad Request`: `{ "error": "Fields 'type' and 'payload' are required" }`

---

### 2. `GET /jobs/:id`
Retrieves job status, attempt count, last error, timestamps, and execution result.

**Response Schema (`200 OK`):**
```json
{
  "id": "7b520d8e-88d5-44e3-9d30-09b128f3d96a",
  "type": "agent.calculate",
  "priority": 5,
  "status": "completed",
  "payload": { "x": 7, "y": 6 },
  "result": { "product": 42 },
  "attempts": 1,
  "traceId": "trace-session-42",
  "parentJobId": null,
  "agentRole": "math_specialist",
  "lastError": null,
  "startedAt": "2026-09-30T18:04:19.000Z",
  "completedAt": "2026-09-30T18:04:20.000Z",
  "createdAt": "2026-09-30T18:04:18.000Z",
  "updatedAt": "2026-09-30T18:04:20.000Z"
}
```

---

### 3. `GET /jobs`
Queries recent jobs with optional query filters:
- `?status=pending|running|completed|dead`
- `?traceId=<traceId>`
- `?parentJobId=<parentJobId>`
- `?limit=50`

---

### 4. `GET /agent/tasks/:id/subtasks`
Queries all child subtasks spawned by a parent job.

---

### 5. `GET /dead-jobs`
Lists entries in the Dead Letter Queue.

---

### 6. `POST /dead-jobs/:id/replay`
Resurrects a permanently failed job from the Dead Letter Queue back into `pending` state with attempts reset to `0`.
