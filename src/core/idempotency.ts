import { db } from "../db/index.js";
import { idempotencyKeys } from "../db/schema.js";
import { eq, and, lt } from "drizzle-orm";

export type IdempotencyAcquireResult = "acquired" | "completed" | "processing" | "retry";

export async function claimIdempotencyKey(
  key: string,
  workerId: string,
  leaseDurationMs: number = 300_000,
) {
  const [record] = await db
    .insert(idempotencyKeys)
    .values({
      key,
      status: "processing",
      lockedBy: workerId,
      lockedUntil: new Date(Date.now() + leaseDurationMs),
    })
    .onConflictDoNothing()
    .returning();

  return record;
}

export async function getIdempotencyKey(key: string) {
  const [record] = await db
    .select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key));

  return record;
}

export async function acquireIdempotencyKey(
  key: string,
  workerId: string,
  leaseDurationMs: number = 300_000,
): Promise<IdempotencyAcquireResult> {
  // 1. Try creating it
  const created = await claimIdempotencyKey(key, workerId, leaseDurationMs);
  if (created) {
    return "acquired";
  }

  // 2. It already exists
  const existing = await getIdempotencyKey(key);
  if (!existing) {
    return "retry";
  }

  // 3. Already completed
  if (existing.status === "completed") {
    return "completed";
  }

  // 4. Someone else still owns an active lease
  if (
    existing.status === "processing" &&
    existing.lockedUntil &&
    existing.lockedUntil > new Date()
  ) {
    return "processing";
  }

  // 5. Reclaim expired lease
  const [reclaimed] = await db
    .update(idempotencyKeys)
    .set({
      lockedBy: workerId,
      lockedUntil: new Date(Date.now() + leaseDurationMs),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(idempotencyKeys.key, key),
        eq(idempotencyKeys.status, "processing"),
        lt(idempotencyKeys.lockedUntil, new Date()),
      ),
    )
    .returning();

  if (reclaimed) {
    return "acquired";
  }

  return "processing";
}

export async function completeIdempotencyKey(
  key: string,
  workerId: string,
  result?: unknown,
) {
  await db
    .update(idempotencyKeys)
    .set({
      status: "completed",
      result: result ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(idempotencyKeys.key, key),
        eq(idempotencyKeys.lockedBy, workerId),
        eq(idempotencyKeys.status, "processing"),
      ),
    );
}

export async function pruneExpiredIdempotencyKeys(retentionDays: number = 7): Promise<number> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.status, "completed"),
        lt(idempotencyKeys.updatedAt, cutoffDate),
      ),
    )
    .returning();

  return deleted.length;
}
