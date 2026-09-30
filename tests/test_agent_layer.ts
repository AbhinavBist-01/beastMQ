import http from "node:http";
import { app } from "../src/api/app.js";
import { BeastMQClient } from "../src/agent/client.js";
import { taskRegistry } from "../src/agent/registry.js";
import { WorkerRunner } from "../src/worker/runner.js";
import { db, pool } from "../src/db/index.js";
import { jobs, deadJobs } from "../src/db/schema.js";
import { eq, inArray } from "drizzle-orm";

async function main() {
  console.log("\n========================================================");
  console.log("🧪 TESTING AGENTIC LAYER & CAPABILITIES");
  console.log("========================================================");

  const TEST_PORT = 3199;
  const server = http.createServer(app);
  await new Promise<void>((resolve) =>
    server.listen(TEST_PORT, () => resolve()),
  );
  console.log(`1. Test API Server listening on port ${TEST_PORT}`);

  const client = new BeastMQClient(`http://localhost:${TEST_PORT}`);
  const createdJobIds: string[] = [];

  try {
    // -------------------------------------------------------------------
    // STEP 1: Register custom agent task handler
    // -------------------------------------------------------------------
    taskRegistry.register(
      "agent.calculate",
      async (payload: { x: number; y: number }, context) => {
        console.log(
          `   [Handler] Executing agent.calculate for jobId=${context.jobId}, traceId=${context.traceId}`,
        );
        return {
          sum: payload.x + payload.y,
          product: payload.x * payload.y,
          handledByRole: context.agentRole,
          jobId: context.jobId,
        };
      },
    );

    // -------------------------------------------------------------------
    // STEP 2: Enqueue parent agent task
    // -------------------------------------------------------------------
    const parent = await client.enqueue({
      type: "agent.calculate",
      payload: { x: 7, y: 6 },
      traceId: "trace-session-42",
      agentRole: "math_specialist",
      priority: 5,
    });
    createdJobIds.push(parent.id);
    console.log(`2. Enqueued parent agent task: ${parent.id}`);

    // -------------------------------------------------------------------
    // STEP 3: Spawn child subagent task
    // -------------------------------------------------------------------
    const child = await client.spawnSubtask(parent.id, {
      type: "agent.calculate",
      payload: { x: 10, y: 20 },
      agentRole: "subagent_calculator",
    });
    createdJobIds.push(child.id);
    console.log(
      `3. Spawned child subagent task: ${child.id} linked to parent: ${parent.id}`,
    );

    // -------------------------------------------------------------------
    // STEP 4: Process jobs via WorkerRunner
    // -------------------------------------------------------------------
    const worker = new WorkerRunner({ concurrency: 1, minPollDelayMs: 50 });
    // Process parent
    const didParent = await worker.processSingleJob();
    console.log(`4. Worker processed parent job: ${didParent}`);

    // Process child
    const didChild = await worker.processSingleJob();
    console.log(`5. Worker processed child job: ${didChild}`);

    // -------------------------------------------------------------------
    // STEP 5: Verify results and agent context
    // -------------------------------------------------------------------
    const parentJob = await client.waitForJob(parent.id, { timeoutMs: 5000 });
    console.log(`6. Retrieved parent result:`, parentJob.result);
    if (!parentJob.result || (parentJob.result as any).product !== 42) {
      throw new Error(
        `Unexpected parent result: ${JSON.stringify(parentJob.result)}`,
      );
    }

    const childJob = await client.waitForJob(child.id, { timeoutMs: 5000 });
    console.log(`7. Retrieved child result:`, childJob.result);
    if (!childJob.result || (childJob.result as any).sum !== 30) {
      throw new Error(
        `Unexpected child result: ${JSON.stringify(childJob.result)}`,
      );
    }

    // -------------------------------------------------------------------
    // STEP 6: Verify subtask query endpoint
    // -------------------------------------------------------------------
    const subtasks = await client.getSubtasks(parent.id);
    console.log(
      `8. Subtasks query for parent returned ${subtasks.length} child tasks`,
    );
    if (subtasks.length !== 1 || subtasks[0]?.id !== child.id) {
      throw new Error(`Subtasks query mismatch`);
    }

    // -------------------------------------------------------------------
    // STEP 7: Verify Dead Letter Queue & Replay
    // -------------------------------------------------------------------
    const [deadRecord] = await db
      .insert(deadJobs)
      .values({
        jobId: parent.id,
        type: "failing.task",
        payload: { sample: "error-payload" },
        attempts: 5,
        error: "Test Fatal Failure",
      })
      .returning();

    console.log(`9. Inserted test dead job: ${deadRecord.id}`);
    const deadList = await client.listDeadJobs();
    const foundDead = deadList.find((d) => d.id === deadRecord.id);
    if (!foundDead) {
      throw new Error(`Expected dead job ${deadRecord.id} in DLQ list`);
    }

    const replayRes = await client.replayDeadJob(deadRecord.id);
    console.log(`10. Replayed dead job:`, replayRes);
    if (!replayRes.replayed || !replayRes.jobId) {
      throw new Error(`Replay failed: ${JSON.stringify(replayRes)}`);
    }
    createdJobIds.push(replayRes.jobId);

    console.log("\n========================================================");
    console.log("🎉 AGENTIC LAYER INTEGRATION TESTS PASSED!");
    console.log("========================================================");
  } finally {
    // Cleanup test records
    if (createdJobIds.length > 0) {
      await db.delete(jobs).where(inArray(jobs.id, createdJobIds));
    }
    server.close();
    await pool.end();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("❌ Agentic Layer Test Failed:", err);
  process.exit(1);
});
