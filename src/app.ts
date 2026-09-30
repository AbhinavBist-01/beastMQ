import "dotenv/config";
import express from "express";

import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { jobs } from "./db/schema.js";

const app = express();

app.use(express.json());

app.post("/jobs", async (req, res) => {
  const body = req.body as {
    type: string;
    payload: unknown;
    idempotencyKey?: string;
    priority?: number;
  };

  let [job] = await db
    .insert(jobs)
    .values({
      type: body.type,
      payload: body.payload,
      idempotencyKey: body.idempotencyKey,
      priority: body.priority,
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
export { app };
