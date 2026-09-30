import crypto from "node:crypto";
import { db } from "../db/index.js";
import { jobs } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { claimJob } from "../core/claim.js";
import { startHeartbeat } from "../core/lease.js";
import { acquireIdempotencyKey, completeIdempotencyKey } from "../core/idempotency.js";
import { handleJobFailure } from "../core/retry.js";
import { executeJob } from "../agent/executor.js";
import { isShuttingDown } from "./shutdown.js";

export interface WorkerOptions {
  workerId?: string | undefined;
  concurrency?: number | undefined;
  minPollDelayMs?: number | undefined;
  maxPollDelayMs?: number | undefined;
  jobTimeoutMs?: number | undefined;
  leaseDurationMs?: number | undefined;
  maxAttempts?: number | undefined;
}

export class WorkerRunner {
  readonly workerId: string;
  readonly concurrency: number;
  readonly minPollDelay: number;
  readonly maxPollDelay: number;
  readonly jobTimeout: number;
  readonly leaseDurationMs: number;
  readonly maxAttempts: number;

  constructor(options: WorkerOptions = {}) {
    this.workerId = options.workerId ?? crypto.randomUUID();
    this.concurrency = options.concurrency ?? parseInt(process.env.CONCURRENCY || "5", 10);
    this.minPollDelay = options.minPollDelayMs ?? parseInt(process.env.MIN_POLL_DELAY || "100", 10);
    this.maxPollDelay = options.maxPollDelayMs ?? parseInt(process.env.MAX_POLL_DELAY || "5000", 10);
    this.jobTimeout = options.jobTimeoutMs ?? parseInt(process.env.JOB_TIMEOUT || "30000", 10);
    this.leaseDurationMs = options.leaseDurationMs ?? parseInt(process.env.LEASE_DURATION_MS || "300000", 10);
    this.maxAttempts = options.maxAttempts ?? 5;
  }

  async processSingleJob(): Promise<boolean> {
    const job = await claimJob(this.workerId, this.leaseDurationMs);
    if (!job) {
      return false;
    }

    console.log(`Processing job with ID: ${job.id}`);
    let heartbeat: NodeJS.Timeout | undefined;

    try {
      if (job.idempotencyKey) {
        const idempResult = await acquireIdempotencyKey(
          job.idempotencyKey,
          this.workerId,
          this.leaseDurationMs,
        );

        if (idempResult === "completed") {
          console.log(`Job with idempotency key ${job.idempotencyKey} has already been completed.`);
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

        if (idempResult === "processing" || idempResult === "retry") {
          console.log(`Idempotency key ${job.idempotencyKey} status is '${idempResult}', releasing job back to pending.`);
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

      // Start active heartbeat
      heartbeat = startHeartbeat(job.id, this.workerId, job.idempotencyKey, 10_000, this.leaseDurationMs);

      // Execute task via agent executor (supports handlers, tools, and mock payloads)
      const result = await executeJob(job, this.jobTimeout);

      // Mark idempotency key completed
      if (job.idempotencyKey) {
        await completeIdempotencyKey(job.idempotencyKey, this.workerId, result);
      }

      // Complete job with result
      await db
        .update(jobs)
        .set({
          status: "completed",
          completedAt: new Date(),
          result: result ?? null,
          lockedBy: null,
          lockedUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id));

      console.log(`Job with ID: ${job.id} completed successfully.`);
      return true;
    } catch (error) {
      await handleJobFailure(job, error, this.maxAttempts);
      return true;
    } finally {
      if (heartbeat) {
        clearInterval(heartbeat);
      }
    }
  }

  private async runFiber(fiberIndex: number): Promise<void> {
    let pollDelay = this.minPollDelay;
    while (!isShuttingDown()) {
      try {
        const didWork = await this.processSingleJob();
        if (didWork) {
          pollDelay = this.minPollDelay;
        } else {
          await new Promise((resolve) => setTimeout(resolve, pollDelay));
          pollDelay = Math.min(pollDelay * 2, this.maxPollDelay);
        }
      } catch (err) {
        console.error(`Worker fiber ${fiberIndex} encountered error:`, err);
        await new Promise((resolve) => setTimeout(resolve, pollDelay));
      }
    }
  }

  async drain(): Promise<number> {
    let processedCount = 0;
    while (!isShuttingDown()) {
      const didWork = await this.processSingleJob();
      if (didWork) {
        processedCount++;
      } else {
        break;
      }
    }
    return processedCount;
  }

  async start(): Promise<void> {
    console.log(
      `Worker ${this.workerId} started with concurrency ${this.concurrency}. Listening for jobs...`,
    );

    const fibers = Array.from({ length: this.concurrency }, (_, i) =>
      this.runFiber(i + 1),
    );

    await Promise.all(fibers);
    console.log("All workers stopped gracefully.");
  }
}
