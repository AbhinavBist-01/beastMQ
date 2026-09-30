import { db } from "../db/index.js";
import { jobs } from "../db/schema.js";
import { eq, and, or, lt, lte, sql, asc, desc } from "drizzle-orm";
import type { JobRecord } from "./types.js";

export async function claimJob(
  workerId: string,
  leaseDurationMs: number = 300_000,
): Promise<JobRecord | null> {
  const now = new Date();
  return await db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(jobs)
      .where(
        or(
          and(eq(jobs.status, "pending"), lte(jobs.availableAt, now)),
          and(eq(jobs.status, "running"), lt(jobs.lockedUntil, now)),
        ),
      )
      .orderBy(desc(jobs.priority), asc(jobs.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });

    if (!job) return null;

    const lockedUntil = new Date(Date.now() + leaseDurationMs);

    const [claimedJob] = await tx
      .update(jobs)
      .set({
        status: "running",
        attempts: sql`${jobs.attempts} + 1`,
        lockedBy: workerId,
        lockedUntil,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id))
      .returning();

    return claimedJob ?? null;
  });
}
