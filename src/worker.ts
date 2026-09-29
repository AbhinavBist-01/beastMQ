import { db } from "./db/index.js";
import { jobs } from "./db/schema.js";
import { eq, and, or, lt, lte, sql } from "drizzle-orm";
import crypto from "node:crypto";

const workerId = crypto.randomUUID();

console.log(`Worker ${workerId} started`);

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
    await new Promise((resolve) => setTimeout(resolve, 10_000));

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
