import { db } from "../db/index.js";
import { jobs, idempotencyKeys } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

export function startHeartbeat(
  jobId: string,
  workerId: string,
  idempotencyKey?: string | null,
  heartbeatIntervalMs: number = 10_000,
  leaseDurationMs: number = 300_000,
): NodeJS.Timeout {
  const interval = setInterval(async () => {
    try {
      // Extend job lease
      await db
        .update(jobs)
        .set({
          lockedUntil: new Date(Date.now() + leaseDurationMs),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(jobs.id, jobId),
            eq(jobs.lockedBy, workerId),
            eq(jobs.status, "running"),
          ),
        );

      // Extend idempotency lease
      if (idempotencyKey) {
        await db
          .update(idempotencyKeys)
          .set({
            lockedUntil: new Date(Date.now() + leaseDurationMs),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(idempotencyKeys.key, idempotencyKey),
              eq(idempotencyKeys.lockedBy, workerId),
              eq(idempotencyKeys.status, "processing"),
            ),
          );
      }

      console.log(`Heartbeat sent for job ${jobId}`);
    } catch (err) {
      console.error(`Failed to renew heartbeat for job ${jobId}:`, err);
    }
  }, heartbeatIntervalMs);

  return interval;
}
