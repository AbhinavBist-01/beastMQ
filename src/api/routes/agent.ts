import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { jobs } from "../../db/schema.js";

const router = Router();

// POST /agent/tasks - Tailored agent dispatch endpoint
router.post("/tasks", async (req, res) => {
  const { type, payload, priority = 0, idempotencyKey, traceId, parentJobId, agentRole } = req.body;

  if (!type || payload === undefined) {
    return res.status(400).json({ error: "Missing required 'type' or 'payload'" });
  }

  const [job] = await db
    .insert(jobs)
    .values({
      type,
      payload,
      priority,
      idempotencyKey,
      traceId,
      parentJobId,
      agentRole,
    })
    .onConflictDoNothing()
    .returning();

  if (!job && idempotencyKey) {
    const [existing] = await db.select().from(jobs).where(eq(jobs.idempotencyKey, idempotencyKey));
    if (existing) {
      return res.status(200).json({ id: existing.id, status: existing.status, duplicate: true });
    }
  }

  if (!job) {
    return res.status(500).json({ error: "Failed to dispatch agent task" });
  }

  return res.status(201).json({ id: job.id, status: job.status });
});

// GET /agent/traces/:traceId - Query all jobs for a trace session
router.get("/traces/:traceId", async (req, res) => {
  const list = await db
    .select()
    .from(jobs)
    .where(eq(jobs.traceId, req.params.traceId))
    .orderBy(desc(jobs.createdAt));

  return res.status(200).json(list);
});

// GET /agent/tasks/:id/subtasks - Query child subtasks of a parent job
router.get("/tasks/:id/subtasks", async (req, res) => {
  const list = await db
    .select()
    .from(jobs)
    .where(eq(jobs.parentJobId, req.params.id))
    .orderBy(desc(jobs.createdAt));

  return res.status(200).json(list);
});

export default router;
