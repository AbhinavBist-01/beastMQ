import { db } from "./db/index.js";
import { jobs } from "./db/schema.js";
import { eq } from "drizzle-orm";

async function processJobs() {
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "pending"))
    .limit(1);

  if (!job) {
    console.log("No jobs available.");
    return;
  }
  console.log(`Processing job with ID: ${job.id} and type: ${job.type}`);

  await new Promise((resolve) => setTimeout(resolve, 5000));

  await db
    .update(jobs)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(jobs.id, job.id));
  console.log(`Job with ID: ${job.id} has been completed.`);
}

async function startWoker() {
  console.log("Worker started. Listening for jobs...");
  while (true) {
    await processJobs();

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
startWoker();
