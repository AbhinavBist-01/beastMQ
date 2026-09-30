import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { jobs, deadJobs } from "../../db/schema.js";

const router = Router();

// GET /dead-jobs - List dead letter queue records
router.get("/", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

  const records = await db
    .select()
    .from(deadJobs)
    .orderBy(desc(deadJobs.failedAt))
    .limit(limit);

  return res.status(200).json(records);
});

// POST /dead-jobs/:id/replay - Replay a dead job back into jobs table
router.post("/:id/replay", async (req, res) => {
  const [deadRecord] = await db
    .select()
    .from(deadJobs)
    .where(eq(deadJobs.id, req.params.id));

  if (!deadRecord) {
    return res.status(404).json({ error: `Dead job record ${req.params.id} not found` });
  }

  // Re-enqueue the job into jobs with status pending, attempts reset to 0
  const [replayedJob] = await db
    .insert(jobs)
    .values({
      type: deadRecord.type,
      payload: deadRecord.payload,
      status: "pending",
      attempts: 0,
      availableAt: new Date(),
    })
    .returning();

  // Remove from dead_jobs upon successful replay
  await db.delete(deadJobs).where(eq(deadJobs.id, deadRecord.id));

  return res.status(200).json({
    replayed: true,
    previousDeadJobId: deadRecord.id,
    newJobId: replayedJob?.id,
  });
});

export default router;
