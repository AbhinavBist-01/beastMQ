import "dotenv/config";
import express from "express";

import { db } from "./db/index.js";
import { jobs } from "./db/schema.js";

const app = express();

app.use(express.json());

app.post("/jobs", async (req, res) => {
  const body = req.body as {
    type: string;
    payload: unknown;
    idempotencyKey?: string;
  };

  const [job] = await db
    .insert(jobs)
    .values({
      type: body.type,
      payload: body.payload,
      idempotencyKey: body.idempotencyKey,
    })
    .returning();

  if (!job) {
    return res.status(500).json({ error: "Failed to create job" });
  }

  return res.status(201).json({ id: job.id, status: job.status });
});
export { app };
