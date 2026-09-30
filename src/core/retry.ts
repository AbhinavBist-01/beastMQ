import { db } from "../db/index.js";
import { jobs, deadJobs } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { JobRecord } from "./types.js";

export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return baseDelay * Math.pow(2, Math.max(0, attempt - 1));
}

export async function handleJobFailure(
  job: JobRecord,
  error: unknown,
  maxAttempts: number = 5,
  baseDelayMs: number = 1000,
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (job.attempts >= maxAttempts) {
    // Terminal failure: Archive to Dead Letter Queue (dead_jobs)
    await db.insert(deadJobs).values({
      jobId: job.id,
      type: job.type,
      payload: job.payload,
      attempts: job.attempts,
      error: errorMessage,
    });

    await db
      .update(jobs)
      .set({
        status: "dead",
        lastError: errorMessage,
        lockedBy: null,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));

    console.error(
      `Job ${job.id} failed after ${job.attempts} attempts. Moved to dead jobs.`,
    );
  } else {
    // Transient failure: Reschedule with exponential backoff
    const delay = getRetryDelay(job.attempts, baseDelayMs);
    const availableAt = new Date(Date.now() + delay);

    await db
      .update(jobs)
      .set({
        status: "pending",
        availableAt,
        lastError: errorMessage,
        lockedBy: null,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));

    console.error(`Job ${job.id} failed. Retrying in ${delay}ms: ${errorMessage}`);
  }
}
