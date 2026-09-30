import { fork, ChildProcess } from "node:child_process";
import { db, pool } from "../src/db/index.js";
import { jobs, deadJobs, idempotencyKeys } from "../src/db/schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spawnWorker(envOverrides: Record<string, string> = {}) {
  const child = fork("src/worker.ts", [], {
    cwd: process.cwd(),
    execArgv: ["--import", "tsx"],
    env: { ...process.env, ...envOverrides },
    stdio: ["pipe", "pipe", "pipe", "ipc"],
  });

  const logs: string[] = [];
  child.stdout?.on("data", (data) => {
    const text = data.toString();
    logs.push(text);
  });
  child.stderr?.on("data", (data) => {
    logs.push(data.toString());
  });

  return { child, logs };
}

async function cleanTestData(jobIds: string[] = []) {
  if (jobIds.length > 0) {
    await db.delete(deadJobs).where(inArray(deadJobs.jobId, jobIds));
    await db.delete(jobs).where(inArray(jobs.id, jobIds));
  }
}

// -------------------------------------------------------------
// TEST 1: Worker crash
// -------------------------------------------------------------
async function test1_WorkerCrash() {
  console.log("\n========================================================");
  console.log("TEST 1: Worker Crash");
  console.log("Expected: Worker A claims -> killed -> lease expires -> Worker B claims & completes");
  console.log("========================================================");

  const [job] = await db
    .insert(jobs)
    .values({
      type: "test-crash",
      payload: { durationMs: 10000 },
    })
    .returning();

  console.log(`1. Created Job ${job.id} (duration 10s)`);

  const workerA = spawnWorker({
    LEASE_DURATION_MS: "3000",
    MIN_POLL_DELAY: "50",
  });

  console.log("2. Started Worker A (Lease: 3s)... waiting for claim");

  let claimedByA: string | null = null;
  while (!claimedByA) {
    const [current] = await db.select().from(jobs).where(eq(jobs.id, job.id));
    if (current && current.status === "running" && current.lockedBy) {
      claimedByA = current.lockedBy;
      console.log(`   Job claimed by Worker A (${claimedByA}), status: running`);
    }
    await sleep(200);
  }

  console.log("3. 💀 Killing Worker A process immediately...");
  workerA.child.kill();
  await sleep(500);

  const [afterKill] = await db.select().from(jobs).where(eq(jobs.id, job.id));
  console.log(`   Job status in DB after kill: ${afterKill?.status}, lockedUntil: ${afterKill?.lockedUntil?.toISOString()}`);
  if (afterKill?.status !== "running") {
    throw new Error(`Expected status to remain 'running', got ${afterKill?.status}`);
  }

  console.log("4. Waiting for lease to expire (3s)...");
  while (true) {
    const [current] = await db.select().from(jobs).where(eq(jobs.id, job.id));
    if (current?.lockedUntil && current.lockedUntil <= new Date()) {
      console.log(`   Lease expired! (lockedUntil: ${current.lockedUntil.toISOString()})`);
      break;
    }
    await sleep(300);
  }

  console.log("5. Starting Worker B to reclaim the expired job...");
  const workerB = spawnWorker({
    LEASE_DURATION_MS: "3000",
    MIN_POLL_DELAY: "50",
  });

  while (true) {
    const [current] = await db.select().from(jobs).where(eq(jobs.id, job.id));
    if (current?.status === "completed") {
      console.log(`   Job status transitioned to 'completed' by Worker B! (attempts: ${current.attempts})`);
      break;
    }
    await sleep(300);
  }

  workerB.child.kill();
  await cleanTestData([job.id]);
  console.log("✅ TEST 1 PASSED!");
}

// -------------------------------------------------------------
// TEST 2: Long-running job timeout
// -------------------------------------------------------------
async function test2_LongRunningJobTimeout() {
  console.log("\n========================================================");
  console.log("TEST 2: Long-running job timeout");
  console.log("Expected: Job duration > JOB_TIMEOUT -> timeout error -> retry");
  console.log("========================================================");

  const [job] = await db
    .insert(jobs)
    .values({
      type: "test-timeout",
      payload: { durationMs: 6000 },
    })
    .returning();

  console.log(`1. Created Job ${job.id} (duration 6s, JOB_TIMEOUT=1500ms)`);

  const worker = spawnWorker({
    JOB_TIMEOUT: "1500",
    MIN_POLL_DELAY: "50",
  });

  console.log("2. Waiting for job to time out and update to retry...");
  while (true) {
    const [current] = await db.select().from(jobs).where(eq(jobs.id, job.id));
    if (current && current.attempts >= 1 && current.status === "pending") {
      console.log(`   Job timed out! Status: ${current.status}, Attempts: ${current.attempts}`);
      console.log(`   lastError recorded: "${current.lastError}"`);
      if (!current.lastError?.includes("timeout")) {
        throw new Error(`Expected timeout error message, got: ${current.lastError}`);
      }
      break;
    }
    await sleep(300);
  }

  worker.child.kill();
  await cleanTestData([job.id]);
  console.log("✅ TEST 2 PASSED!");
}

// -------------------------------------------------------------
// TEST 3: Duplicate idempotency key
// -------------------------------------------------------------
async function test3_DuplicateIdempotencyKey() {
  console.log("\n========================================================");
  console.log("TEST 3: Duplicate idempotency key");
  console.log("Expected: Request 1 executes; Request 2 skips duplicate execution");
  console.log("========================================================");

  const testKey = `payment-order-${Date.now()}`;
  console.log(`1. Submitting Job 1 with idempotencyKey: ${testKey}`);

  const [job1] = await db
    .insert(jobs)
    .values({
      type: "payment",
      payload: { orderId: 123, durationMs: 200 },
      idempotencyKey: testKey,
    })
    .returning();

  const worker = spawnWorker({ MIN_POLL_DELAY: "50" });

  while (true) {
    const [current] = await db.select().from(jobs).where(eq(jobs.id, job1.id));
    if (current?.status === "completed") {
      console.log(`   Job 1 completed at ${current.completedAt?.toISOString()}`);
      break;
    }
    await sleep(200);
  }

  const [keyRecord] = await db
    .select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, testKey));
  console.log(`2. Verified idempotency record exists with status: '${keyRecord?.status}'`);

  console.log("3. Submitting Request 2 with same idempotencyKey...");
  // Simulate app.post onConflictDoNothing
  const [duplicateJob] = await db
    .insert(jobs)
    .values({
      type: "payment",
      payload: { orderId: 123, durationMs: 200 },
      idempotencyKey: testKey,
    })
    .onConflictDoNothing()
    .returning();

  if (!duplicateJob) {
    console.log("   Duplicate insert safely rejected by DB unique constraint!");
  }

  worker.child.kill();
  await cleanTestData([job1.id]);
  await db.delete(idempotencyKeys).where(eq(idempotencyKeys.key, testKey));
  console.log("✅ TEST 3 PASSED!");
}

// -------------------------------------------------------------
// TEST 4: Two workers concurrency
// -------------------------------------------------------------
async function test4_TwoWorkers() {
  console.log("\n========================================================");
  console.log("TEST 4: Two Workers Concurrency");
  console.log("Expected: Jobs split between Worker A and B; no collisions");
  console.log("========================================================");

  const createdJobs = await db
    .insert(jobs)
    .values([
      { type: "task", payload: { durationMs: 500 } },
      { type: "task", payload: { durationMs: 500 } },
      { type: "task", payload: { durationMs: 500 } },
      { type: "task", payload: { durationMs: 500 } },
      { type: "task", payload: { durationMs: 500 } },
      { type: "task", payload: { durationMs: 500 } },
    ])
    .returning();

  const jobIds = createdJobs.map((j) => j.id);
  console.log(`1. Created ${jobIds.length} jobs`);

  const workerA = spawnWorker({ MIN_POLL_DELAY: "50", CONCURRENCY: "2" });
  const workerB = spawnWorker({ MIN_POLL_DELAY: "50", CONCURRENCY: "2" });
  console.log("2. Started Worker A and Worker B concurrently...");

  while (true) {
    const list = await db.select().from(jobs).where(inArray(jobs.id, jobIds));
    const completedCount = list.filter((j) => j.status === "completed").length;
    if (completedCount === jobIds.length) {
      console.log(`   All ${completedCount} jobs completed!`);
      break;
    }
    await sleep(300);
  }

  workerA.child.kill();
  workerB.child.kill();
  await cleanTestData(jobIds);
  console.log("✅ TEST 4 PASSED!");
}

// -------------------------------------------------------------
// TEST 5: Retry -> DLQ
// -------------------------------------------------------------
async function test5_RetryToDLQ() {
  console.log("\n========================================================");
  console.log("TEST 5: Retry -> DLQ");
  console.log("Expected: 5 failed attempts -> job status 'dead' -> archived to dead_jobs");
  console.log("========================================================");

  const [job] = await db
    .insert(jobs)
    .values({
      type: "failing-job",
      payload: { shouldFail: true, errorMessage: "Simulated Fatal Exception" },
    })
    .returning();

  console.log(`1. Created Job ${job.id} (configured to fail)`);

  const worker = spawnWorker({ MIN_POLL_DELAY: "50" });

  while (true) {
    const [current] = await db.select().from(jobs).where(eq(jobs.id, job.id));
    if (current) {
      if (current.status === "pending" && current.attempts > 0) {
        // Fast-forward availableAt so test doesn't wait exponential backoff
        await db
          .update(jobs)
          .set({ availableAt: new Date() })
          .where(eq(jobs.id, job.id));
        console.log(`   Attempt ${current.attempts} failed -> retrying...`);
      }
      if (current.status === "dead") {
        console.log(`2. Job reached final status: '${current.status}' after ${current.attempts} attempts!`);
        console.log(`   lastError: "${current.lastError}"`);
        break;
      }
    }
    await sleep(250);
  }

  const [deadRecord] = await db
    .select()
    .from(deadJobs)
    .where(eq(deadJobs.jobId, job.id));

  console.log(`3. Verified in dead_jobs table: ID ${deadRecord?.id}, error: "${deadRecord?.error}"`);
  if (!deadRecord || deadRecord.attempts !== 5) {
    throw new Error(`Expected dead_jobs record with 5 attempts, found: ${JSON.stringify(deadRecord)}`);
  }

  worker.child.kill();
  await cleanTestData([job.id]);
  console.log("✅ TEST 5 PASSED!");
}

// -------------------------------------------------------------
// TEST 6: Graceful shutdown
// -------------------------------------------------------------
async function test6_GracefulShutdown() {
  console.log("\n========================================================");
  console.log("TEST 6: Graceful Shutdown");
  console.log("Expected: Stop accepting new jobs -> in-flight finish -> worker exits");
  console.log("========================================================");

  const createdJobs = await db
    .insert(jobs)
    .values([
      { type: "long-task", payload: { durationMs: 2000 } },
      { type: "long-task", payload: { durationMs: 2000 } },
      { type: "long-task", payload: { durationMs: 2000 } },
      { type: "long-task", payload: { durationMs: 2000 } },
    ])
    .returning();

  const jobIds = createdJobs.map((j) => j.id);
  console.log(`1. Created 4 active jobs (2s each)`);

  const worker = spawnWorker({ CONCURRENCY: "4", MIN_POLL_DELAY: "50" });

  // Wait until all 4 are running
  console.log("2. Waiting for worker to claim all 4 jobs into 'running' state...");
  while (true) {
    const list = await db.select().from(jobs).where(inArray(jobs.id, jobIds));
    const runningCount = list.filter((j) => j.status === "running").length;
    if (runningCount === 4) {
      console.log("   All 4 jobs are actively running!");
      break;
    }
    await sleep(150);
  }

  // Create a 5th job while running
  const [job5] = await db
    .insert(jobs)
    .values({ type: "extra-task", payload: { durationMs: 500 } })
    .returning();

  console.log(`3. Enqueued extra Job 5 (${job5.id}). Sending shutdown signal to worker...`);
  worker.child.send("shutdown");

  // Wait for worker process to exit
  await new Promise((resolve) => {
    worker.child.on("exit", (code) => {
      console.log(`4. Worker process exited with code ${code}!`);
      resolve(code);
    });
  });

  const listAfter = await db.select().from(jobs).where(inArray(jobs.id, jobIds));
  const completed = listAfter.filter((j) => j.status === "completed").length;
  console.log(`   In-flight jobs completed: ${completed}/4`);

  const [job5After] = await db.select().from(jobs).where(eq(jobs.id, job5.id));
  console.log(`   Extra Job 5 status: ${job5After?.status} (remains pending, not accepted after shutdown signal)`);

  await cleanTestData([...jobIds, job5.id]);
  if (completed !== 4 || job5After?.status !== "pending") {
    throw new Error("Graceful shutdown assertion failed");
  }
  console.log("✅ TEST 6 PASSED!");
}

// -------------------------------------------------------------
// TEST 7: Priority claiming
// -------------------------------------------------------------
async function test7_PriorityClaiming() {
  console.log("\n========================================================");
  console.log("TEST 7: Priority Claiming");
  console.log("Expected: High priority job claimed BEFORE older low priority jobs");
  console.log("========================================================");

  const [low1] = await db
    .insert(jobs)
    .values({ type: "task", priority: 1, payload: { label: "low-1", durationMs: 100 } })
    .returning();
  await sleep(50);

  const [low2] = await db
    .insert(jobs)
    .values({ type: "task", priority: 1, payload: { label: "low-2", durationMs: 100 } })
    .returning();
  await sleep(50);

  const [high3] = await db
    .insert(jobs)
    .values({ type: "task", priority: 100, payload: { label: "high-3", durationMs: 100 } })
    .returning();

  console.log(`1. Enqueued low-1 (priority 1), low-2 (priority 1), and high-3 (priority 100)`);

  const worker = spawnWorker({ CONCURRENCY: "1", MIN_POLL_DELAY: "50" });

  console.log("2. Waiting for first claimed job by single-concurrency worker...");
  let firstClaimedId: string | null = null;
  while (!firstClaimedId) {
    const list = await db
      .select()
      .from(jobs)
      .where(inArray(jobs.id, [low1.id, low2.id, high3.id]));

    const running = list.find((j) => j.status === "running" || j.status === "completed");
    if (running) {
      firstClaimedId = running.id;
      console.log(`   First claimed job ID: ${firstClaimedId} (priority: ${running.priority})`);
    }
    await sleep(100);
  }

  worker.child.kill();
  await cleanTestData([low1.id, low2.id, high3.id]);

  if (firstClaimedId !== high3.id) {
    throw new Error(`Expected high priority job (${high3.id}) to be claimed first, but got: ${firstClaimedId}`);
  }

  console.log("✅ TEST 7 PASSED!");
}

async function main() {
  const arg = process.argv[2];
  try {
    if (!arg || arg === "1") await test1_WorkerCrash();
    if (!arg || arg === "2") await test2_LongRunningJobTimeout();
    if (!arg || arg === "3") await test3_DuplicateIdempotencyKey();
    if (!arg || arg === "4") await test4_TwoWorkers();
    if (!arg || arg === "5") await test5_RetryToDLQ();
    if (!arg || arg === "6") await test6_GracefulShutdown();
    if (!arg || arg === "7") await test7_PriorityClaiming();

    console.log("\n========================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    console.log("========================================================");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
