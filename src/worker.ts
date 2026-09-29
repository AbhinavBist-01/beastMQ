import { db } from "./db/index.js";
import { jobs } from "./db/schema.js";
import { eq, sql } from "drizzle-orm";

async function claimJob() {
  return await db.transaction(async (tx) => {
    const [job] = await tx
      .select()
      .from(jobs)
      .where(eq(jobs.status, "pending"))
      .limit(1)
      .for("update", { skipLocked: true });
    if (!job) return null;

    const [claimedJob] = await tx
      .update(jobs)
      .set({ status: "running", updatedAt: new Date() })
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
