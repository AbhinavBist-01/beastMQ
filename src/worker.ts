import { db } from "./db/index.js";
import { jobs } from "./db/schema.js";
import { eq, sql, and } from "drizzle-orm";
import crypto from "node:crypto";

const workerId = crypto.randomUUID();

console.log(`Worker ${workerId} started`);

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
  return await db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(jobs)
      .where(eq(jobs.status, "pending"))
      .orderBy(jobs.createdAt)
      .limit(1)
      .for("update", { skipLocked: true });

    if (!job) return null;

    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);

    const [claimedJob] = await tx
      .update(jobs)
      .set({
        status: "running",
        updatedAt: new Date(),
        lockedBy: workerId,
        lockedUntil,
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
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await db
      .update(jobs)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
    console.log(`Job with ID: ${job.id} completed successfully.`);
  } catch (error) {
    await db
      .update(jobs)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
    console.error(`Job with ID: ${job.id} failed with error:`, error);
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
