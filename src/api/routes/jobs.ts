import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { jobs } from "../../db/schema.js";
import type { EnqueueJobInput } from "../../core/types.js";
import { isValidUUID } from "../validation.js";

const router = Router();

// POST /jobs - Enqueue job or agent task
router.post("/", async (req, res) => {
  const body = req.body as EnqueueJobInput;

  if (!body.type || typeof body.type !== "string") {
    return res.status(400).json({ error: "Field 'type' must be a non-empty string" });
  }

  if (body.type.length > 255) {
    return res.status(400).json({ error: "Field 'type' exceeds maximum length of 255 characters" });
  }

  if (body.payload === undefined) {
    return res.status(400).json({ error: "Field 'payload' is required" });
  }

  if (body.parentJobId !== undefined && !isValidUUID(body.parentJobId)) {
    return res.status(400).json({ error: "Field 'parentJobId' must be a valid UUID" });
  }

  if (body.priority !== undefined && (typeof body.priority !== "number" || isNaN(body.priority))) {
    return res.status(400).json({ error: "Field 'priority' must be a valid number" });
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
  const id = req.params.id;
  if (!isValidUUID(id)) {
    return res.status(400).json({ error: `Invalid UUID format for job ID: ${id}` });
  }

  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, id));

  if (!job) {
    return res.status(404).json({ error: `Job ${id} not found` });
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
