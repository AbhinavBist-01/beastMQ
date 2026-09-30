import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { jobs } from "../../db/schema.js";
import type { EnqueueJobInput } from "../../core/types.js";

const router = Router();

// POST /jobs - Enqueue job or agent task
router.post("/", async (req, res) => {
  const body = req.body as EnqueueJobInput;

  if (!body.type || body.payload === undefined) {
    return res.status(400).json({ error: "Fields 'type' and 'payload' are required" });
  }

  let [job] = await db
    .insert(jobs)
    .values({
      type: body.type,
      payload: body.payload,
      idempotencyKey: body.idempotencyKey,
      priority: body.priority ?? 0,
      traceId: body.traceId,
      parentJobId: body.parentJobId,
      agentRole: body.agentRole,
    })
    .onConflictDoNothing()
    .returning();

  if (!job && body.idempotencyKey) {
    [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.idempotencyKey, body.idempotencyKey));

    if (job) {
      return res.status(200).json({ id: job.id, status: job.status, duplicate: true });
    }
  }

  if (!job) {
    return res.status(500).json({ error: "Failed to create job" });
  }

  return res.status(201).json({ id: job.id, status: job.status });
});

// GET /jobs/:id - Get job by ID with status, attempts, error, result
router.get("/:id", async (req, res) => {
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, req.params.id));

  if (!job) {
    return res.status(404).json({ error: `Job ${req.params.id} not found` });
  }

  return res.status(200).json(job);
});

// GET /jobs - List jobs with optional filters
router.get("/", async (req, res) => {
  const { status, traceId, parentJobId, limit = "50" } = req.query;
  const maxLimit = Math.min(parseInt(limit as string, 10) || 50, 100);

  const conditions = [];
  if (status) conditions.push(eq(jobs.status, status as string));
  if (traceId) conditions.push(eq(jobs.traceId, traceId as string));
  if (parentJobId) conditions.push(eq(jobs.parentJobId, parentJobId as string));

  const query = db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(maxLimit);

  const results = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  return res.status(200).json(results);
});

export default router;
