import http from "node:http";
import { app } from "../src/api/app.js";
import { BeastMQClient } from "../src/agent/client.js";
import { taskRegistry } from "../src/agent/registry.js";
import { WorkerRunner } from "../src/worker/runner.js";
import { pool } from "../src/db/index.js";
import { pruneExpiredIdempotencyKeys } from "../src/core/idempotency.js";

async function verifyPatches() {
  console.log("\n========================================================");
  console.log("🛡️ VERIFYING SECURITY PATCHES & RESILIENCE MITIGATIONS");
  console.log("========================================================\n");

  const TEST_PORT = 3298;
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  const baseUrl = `http://localhost:${TEST_PORT}`;
  const client = new BeastMQClient(baseUrl);

  let passedChecks = 0;

  // -------------------------------------------------------------------------
  // TEST 1: UUID Validation (Expected: 400 Bad Request, not 500)
  // -------------------------------------------------------------------------
  console.log("Test 1: Testing invalid UUID input to GET /jobs/:id...");
  const res1 = await fetch(`${baseUrl}/jobs/invalid-uuid-string`);
  const body1 = await res1.json();
  console.log(`   Status: ${res1.status}, Response:`, body1);
  if (res1.status === 400 && body1.error?.includes("Invalid UUID format")) {
    console.log("   ✅ PATCH VERIFIED: Invalid UUID cleanly rejected with 400 Bad Request!");
    passedChecks++;
  } else {
    throw new Error(`Expected 400 Bad Request, got ${res1.status}`);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Type Column Overflow Validation (Expected: 400 Bad Request)
  // -------------------------------------------------------------------------
  console.log("\nTest 2: Testing oversized 'type' field (> 255 chars)...");
  const longType = "x".repeat(300);
  const res2 = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: longType, payload: { test: true } }),
  });
  const body2 = await res2.json();
  console.log(`   Status: ${res2.status}, Response:`, body2);
  if (res2.status === 400 && body2.error?.includes("exceeds maximum length")) {
    console.log("   ✅ PATCH VERIFIED: Oversized type string cleanly rejected with 400 Bad Request!");
    passedChecks++;
  } else {
    throw new Error(`Expected 400 Bad Request, got ${res2.status}`);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Invalid parentJobId UUID validation
  // -------------------------------------------------------------------------
  console.log("\nTest 3: Testing invalid parentJobId on POST /jobs...");
  const res3 = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "test.valid", payload: {}, parentJobId: "not-uuid" }),
  });
  const body3 = await res3.json();
  console.log(`   Status: ${res3.status}, Response:`, body3);
  if (res3.status === 400 && body3.error?.includes("parentJobId")) {
    console.log("   ✅ PATCH VERIFIED: Invalid parentJobId rejected with 400 Bad Request!");
    passedChecks++;
  } else {
    throw new Error(`Expected 400 Bad Request, got ${res3.status}`);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Zombie Task Prevention via AbortSignal
  // -------------------------------------------------------------------------
  console.log("\nTest 4: Testing AbortSignal task cancellation on timeout...");
  let handlerAbortedCleanly = false;
  let codeRanAfterAbort = false;

  taskRegistry.register("test.abortable", async (_payload, context) => {
    console.log("   [Handler] Started task, listening to context.signal...");
    context.signal.addEventListener("abort", () => {
      console.log("   [Handler] 🛑 Received abort signal! Reason:", context.signal.reason?.message);
      handlerAbortedCleanly = true;
    });

    // Abortable sleep pattern
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        codeRanAfterAbort = true;
        resolve();
      }, 1500);

      context.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(context.signal.reason);
      }, { once: true });
    });
  });

  const worker = new WorkerRunner({ jobTimeoutMs: 300, minPollDelayMs: 50 });
  const job = await client.enqueue({
    type: "test.abortable",
    payload: {},
    priority: 1000,
  });

  console.log(`   Enqueued job ${job.id} with 300ms timeout. Processing job...`);
  await worker.processSingleJob(); // Times out at 300ms

  // Wait to confirm zombie code did NOT run
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (handlerAbortedCleanly && !codeRanAfterAbort) {
    console.log("   ✅ PATCH VERIFIED: Handler received abort signal and ceased execution cleanly (No zombie task)!");
    passedChecks++;
  } else {
    throw new Error(`AbortSignal verification failed: handlerAborted=${handlerAbortedCleanly}, codeRanAfter=${codeRanAfterAbort}`);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Idempotency Key Pruning
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Testing idempotency key pruning...");
  const pruned = await pruneExpiredIdempotencyKeys(30);
  console.log(`   Pruned ${pruned} expired idempotency keys.`);
  console.log("   ✅ PATCH VERIFIED: Idempotency pruning query executed successfully!");
  passedChecks++;

  // -------------------------------------------------------------------------
  // TEST 6: Connection Pool Sizing
  // -------------------------------------------------------------------------
  console.log("\nTest 6: Checking PostgreSQL connection pool settings...");
  console.log(`   Pool max connections configured: ${(pool as any).options.max}`);
  if ((pool as any).options.max >= 20) {
    console.log("   ✅ PATCH VERIFIED: Dynamic connection pool configured with resilient ceiling!");
    passedChecks++;
  } else {
    throw new Error(`Expected pool max >= 20, got ${(pool as any).options.max}`);
  }

  // -------------------------------------------------------------------------
  // TEST 7: API Key Authentication Middleware
  // -------------------------------------------------------------------------
  console.log("\nTest 7: Testing API Key Authentication Middleware...");
  process.env.BEASTMQ_API_KEY = "super-secret-key-123";

  // Request without key -> 401
  const unauthRes = await fetch(`${baseUrl}/jobs`);
  console.log(`   Unauthenticated request status: ${unauthRes.status}`);

  // Request with valid key -> 200
  const authRes = await fetch(`${baseUrl}/jobs`, {
    headers: { "x-api-key": "super-secret-key-123" },
  });
  console.log(`   Authenticated request status: ${authRes.status}`);

  // Reset
  delete process.env.BEASTMQ_API_KEY;

  if (unauthRes.status === 401 && authRes.status === 200) {
    console.log("   ✅ PATCH VERIFIED: API Key authentication blocks unauthorized requests and admits valid keys!");
    passedChecks++;
  } else {
    throw new Error(`Auth test failed: unauth=${unauthRes.status}, auth=${authRes.status}`);
  }

  console.log("\n========================================================");
  console.log(`🎉 ALL ${passedChecks}/7 SECURITY & RESILIENCE PATCHES VERIFIED!`);
  console.log("========================================================\n");

  server.close();
  await pool.end();
  process.exit(0);
}

verifyPatches().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
