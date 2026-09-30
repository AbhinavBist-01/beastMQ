import { db } from "./db/index.js";
import { jobs, deadJobs, idempotencyKeys } from "./db/schema.js";
import { eq, and, or, lt, lte, sql, asc, desc } from "drizzle-orm";
import crypto from "node:crypto";

const workerId = crypto.randomUUID();

console.log(`Worker ${workerId} started`);
let shuttingDown = false;

process.on("SIGINT", () => {
  console.log("Shutdown signal received...");
  shuttingDown = true;
});

process.on("SIGTERM", () => {
  console.log("Shutdown signal received...");
  shuttingDown = true;
});

const CONCURRENCY = 5;

async function claimIdempotencyKey(key: string) {
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

  const [reclaimed] = await db
    .update(idempotencyKeys)
    .set({
      lockedBy: workerId,
      lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
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

function getRetryDelay(attempt: number) {
  const baseDelay = 1000;

  return baseDelay * Math.pow(2, attempt - 1);
}

function startHeartbeat(jobId: string, idempotencyKey?: string | null) {
  const interval = setInterval(async () => {
    // Extend job lease
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

    // Extend idempotency lease
    if (idempotencyKey) {
      await db
        .update(idempotencyKeys)
        .set({
          lockedUntil: new Date(Date.now() + 5 * 60 * 1000),
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
  }, 10_000);

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
      .orderBy(asc(jobs.createdAt), desc(jobs.priority))
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

  let heartbeat: NodeJS.Timeout | undefined;

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

      // If the idempotency key is in a "retry" state, we should retry the job.
      if (result === "retry") {
        console.log(`Job ${job.id} needs to be retried.`);
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
    }

    heartbeat = startHeartbeat(job.id, job.idempotencyKey);
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    if (job.idempotencyKey) {
      await db
        .update(idempotencyKeys)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(idempotencyKeys.key, job.idempotencyKey),
            eq(idempotencyKeys.lockedBy, workerId),
            eq(idempotencyKeys.status, "processing"),
          ),
        );
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
    if (heartbeat) {
      clearInterval(heartbeat);
    }
  }
}

async function startWoker() {
  console.log("Worker started. Listening for jobs...");

  const runningJobs = new Set<Promise<void>>();
  while (!shuttingDown || runningJobs.size > 0) {
    while (!shuttingDown && runningJobs.size < CONCURRENCY) {
      const promise = processJobs();

      runningJobs.add(promise);

      promise.finally(() => {
        runningJobs.delete(promise);
      });
    }
    await Promise.race(runningJobs);
  }
}
startWoker();
