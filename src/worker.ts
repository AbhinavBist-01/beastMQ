import { db } from "./db/index.js";
import { jobs, deadJobs, idempotencyKeys } from "./db/schema.js";
import { eq, and, or, lt, lte, sql } from "drizzle-orm";
import crypto from "node:crypto";

const workerId = crypto.randomUUID();

console.log(`Worker ${workerId} started`);

async function claimIdempotencyKey(key: string) {
  const now = new Date();

  const [record] = await db
    .insert(idempotencyKeys)
    .values({
      key,
      status: "processing",
      lockedBy: workerId,
      lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
    })
    .onConflictDoNothing()
    .returning();

  return record;
}

async function getIdempotencyKey(key: string) {
  const [record] = await db
    .select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key));

  return record;
}

async function acquireIdempotencyKey(key: string) {
  // 1. Try creating it
  const created = await claimIdempotencyKey(key);

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

  // 4. Someone else still owns it
  if (
    existing.status === "processing" &&
    existing.lockedUntil &&
    existing.lockedUntil > new Date()
  ) {
    return "processing";
  }

  // 5. Lease expired → reclaim
  // we'll implement this next
  return "expired";
}

function getRetryDelay(attempt: number) {
  const baseDelay = 1000;

  return baseDelay * Math.pow(2, attempt - 1);
}

function startheartbeat(jobId: string) {
  const interval = setInterval(async () => {
    await db
      .update(jobs)
      .set({
        lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.lockedBy, workerId),
          eq(jobs.status, "running"),
        ),
      );
    console.log(`Heartbeat sent for job ${jobId}`);
  }, 10000);
  return interval;
}

async function claimJob() {
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
      .orderBy(jobs.createdAt)
      .limit(1)
      .for("update", { skipLocked: true });

    if (!job) return null;

    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);

    const [claimedJob] = await tx
      .update(jobs)
      .set({
        status: "running",

        attempts: sql`${jobs.attempts} + 1`,

        lockedBy: workerId,
        lockedUntil,

        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id))
      .returning();

    return claimedJob;
  });
}

async function processJobs() {
  const job = await claimJob();
  if (!job) {
    console.log("No jobs available.");
    return;
  }

  console.log(`Processing job with ID: ${job.id}`);

  const heartbeat = startheartbeat(job.id);
  try {
    if (job.idempotencyKey) {
      const result = await acquireIdempotencyKey(job.idempotencyKey);

      if (result === "completed") {
        console.log(
          `Job with idempotency key ${job.idempotencyKey} has already been completed.`,
        );
        await db
          .update(jobs)
          .set({
            status: "completed",
            lockedBy: null,
            lockedUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));
        return;
      }

      if (result === "processing") {
        console.log(
          `Idempotency key ${job.idempotencyKey} is being processed by another worker.`,
        );

        await db
          .update(jobs)
          .set({
            status: "pending",
            lockedBy: null,
            lockedUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));

        return;
      }

      if (result === "expired") {
        console.log(`Idempotency lease expired for ${job.idempotencyKey}.`);

        // We will implement takeover next.
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    if (job.idempotencyKey) {
      await db
        .update(idempotencyKeys)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(idempotencyKeys.key, job.idempotencyKey));
    }

    await db
      .update(jobs)
      .set({
        status: "completed",
        lockedBy: null,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));
    console.log(`Job with ID: ${job.id} completed successfully.`);
  } catch (error) {
    const MAX_ATTEMPTS = 5;

    if (job.attempts >= MAX_ATTEMPTS) {
      await db.insert(deadJobs).values({
        jobId: job.id,
        type: job.type,
        payload: job.payload,
        attempts: job.attempts,
        error: error instanceof Error ? error.message : String(error),
      });

      await db
        .update(jobs)
        .set({
          status: "dead",
          lockedBy: null,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));

      console.error(
        `Job ${job.id} failed after ${job.attempts} attempts. Moved to dead jobs.`,
      );
    } else {
      const delay = getRetryDelay(job.attempts);

      const availableAt = new Date(Date.now() + delay);

      await db
        .update(jobs)
        .set({
          status: "pending",
          availableAt,
          lockedBy: null,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));

      console.error(`Job ${job.id} failed. Retrying in ${delay}ms`);
    }
  } finally {
    clearInterval(heartbeat);
  }
}

async function startWoker() {
  console.log("Worker started. Listening for jobs...");
  while (true) {
    await processJobs();

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
startWoker();
