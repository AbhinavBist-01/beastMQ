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
const MIN_POLL_DELAY = 100;
const MAX_POLL_DELAY = 5000;
const JOB_TIMEOUT = 30_000;

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
      .orderBy(desc(jobs.priority), asc(jobs.createdAt))
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
        startedAt: new Date(),

        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id))
      .returning();

    return claimedJob;
  });
}

async function processJobs(): Promise<boolean> {
  const job = await claimJob();
  if (!job) {
    console.log("No jobs available.");
    return false;
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
            completedAt: new Date(),
            lockedBy: null,
            lockedUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(jobs.id, job.id));
        return true;
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

        return true;
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

        return true;
      }
    }

    heartbeat = startHeartbeat(job.id, job.idempotencyKey);

    await Promise.race([
      new Promise((resolve) => setTimeout(resolve, 10_000)),

      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Job execution timeout")),
          JOB_TIMEOUT,
        ),
      ),
    ]);

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
        completedAt: new Date(),
        lockedBy: null,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));
    console.log(`Job with ID: ${job.id} completed successfully.`);
    return true;
  } catch (error) {
    const MAX_ATTEMPTS = 5;
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (job.attempts >= MAX_ATTEMPTS) {
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
      const delay = getRetryDelay(job.attempts);

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

      console.error(`Job ${job.id} failed. Retrying in ${delay}ms`);
    }
    return true;
  } finally {
    if (heartbeat) {
      clearInterval(heartbeat);
    }
  }
}

async function runWorker(workerIndex: number) {
  let pollDelay = MIN_POLL_DELAY;
  while (!shuttingDown) {
    try {
      const didWork = await processJobs();
      if (didWork) {
        pollDelay = MIN_POLL_DELAY;
      } else {
        await new Promise((resolve) => setTimeout(resolve, pollDelay));
        pollDelay = Math.min(pollDelay * 2, MAX_POLL_DELAY);
      }
    } catch (err) {
      console.error(`Worker fiber ${workerIndex} encountered an error:`, err);
      await new Promise((resolve) => setTimeout(resolve, pollDelay));
    }
  }
}

async function startWoker() {
  console.log(
    `Worker ${workerId} started with concurrency ${CONCURRENCY}. Listening for jobs...`,
  );

  const workers = Array.from({ length: CONCURRENCY }, (_, i) =>
    runWorker(i + 1),
  );
  await Promise.all(workers);
  console.log("All workers stopped gracefully.");
}
startWoker();
