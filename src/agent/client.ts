import type { EnqueueJobInput, EnqueueJobResult, JobRecord, DeadJobRecord, JobStatus } from "../core/types.js";
import { db } from "../db/index.js";
import { jobs, deadJobs } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

export interface WaitForJobOptions {
  timeoutMs?: number | undefined;
  pollIntervalMs?: number | undefined;
}

export interface BeastMQClientOptions {
  baseUrl?: string | undefined;
  apiKey?: string | undefined;
  preferDirect?: boolean | undefined;
}

export class BeastMQClient {
  private baseUrl: string;
  private apiKey?: string | undefined;
  private preferDirect: boolean;

  constructor(baseUrlOrOptions?: string | BeastMQClientOptions, apiKey?: string) {
    if (typeof baseUrlOrOptions === "object" && baseUrlOrOptions !== null) {
      this.baseUrl = (baseUrlOrOptions.baseUrl || process.env.BEASTMQ_URL || "http://localhost:3000").replace(/\/$/, "");
      this.apiKey = baseUrlOrOptions.apiKey || process.env.BEASTMQ_API_KEY;
      this.preferDirect = baseUrlOrOptions.preferDirect ?? !process.env.BEASTMQ_URL;
    } else {
      this.baseUrl = (baseUrlOrOptions || process.env.BEASTMQ_URL || "http://localhost:3000").replace(/\/$/, "");
      this.apiKey = apiKey || process.env.BEASTMQ_API_KEY;
      this.preferDirect = !process.env.BEASTMQ_URL;
    }
  }

  private getHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { ...extra };
    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }
    return headers;
  }

  private isNetworkError(err: any): boolean {
    return (
      err?.name === "TypeError" &&
      (err?.message?.includes("fetch failed") || err?.cause?.code === "ECONNREFUSED")
    );
  }

  /**
   * Enqueues a new background job or agent task.
   */
  async enqueue(input: EnqueueJobInput): Promise<EnqueueJobResult> {
    if (this.preferDirect) {
      try {
        return await this.enqueueDirect(input);
      } catch (err: any) {
        if (!process.env.DATABASE_URL) throw err;
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/jobs`, {
        method: "POST",
        headers: this.getHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Failed to enqueue job (${res.status}): ${errBody}`);
      }

      return (await res.json()) as EnqueueJobResult;
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        return await this.enqueueDirect(input);
      }
      throw err;
    }
  }

  private async enqueueDirect(input: EnqueueJobInput): Promise<EnqueueJobResult> {
    let [job] = await db
      .insert(jobs)
      .values({
        type: input.type,
        payload: input.payload,
        idempotencyKey: input.idempotencyKey,
        priority: input.priority ?? 0,
        traceId: input.traceId,
        parentJobId: input.parentJobId,
        agentRole: input.agentRole,
      })
      .onConflictDoNothing()
      .returning();

    if (!job && input.idempotencyKey) {
      [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.idempotencyKey, input.idempotencyKey));

      if (job) {
        return { id: job.id, status: job.status as JobStatus, duplicate: true };
      }
    }

    if (!job) {
      throw new Error("Failed to enqueue job into database");
    }

    return { id: job.id, status: job.status as JobStatus };
  }

  /**
   * Fetches job metadata, status, and result by ID.
   */
  async getJob(id: string): Promise<JobRecord | null> {
    if (this.preferDirect) {
      try {
        return await this.getJobDirect(id);
      } catch {
        // Fall back to HTTP if direct fails
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/jobs/${id}`, {
        headers: this.getHeaders(),
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new Error(`Failed to fetch job ${id} (${res.status})`);
      }
      return (await res.json()) as JobRecord;
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        return await this.getJobDirect(id);
      }
      throw err;
    }
  }

  private async getJobDirect(id: string): Promise<JobRecord | null> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return (job as JobRecord) || null;
  }

  /**
   * Queries list of jobs with optional status filter.
   */
  async listJobs(options?: { status?: string | undefined; limit?: number | undefined }): Promise<JobRecord[]> {
    if (this.preferDirect) {
      try {
        return await this.listJobsDirect(options);
      } catch {
        // Fall back to HTTP
      }
    }

    try {
      const params = new URLSearchParams();
      if (options?.status) params.set("status", options.status);
      if (options?.limit !== undefined) params.set("limit", options.limit.toString());

      const res = await fetch(`${this.baseUrl}/jobs?${params.toString()}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to list jobs (${res.status})`);
      }
      return (await res.json()) as JobRecord[];
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        return await this.listJobsDirect(options);
      }
      throw err;
    }
  }

  private async listJobsDirect(options?: { status?: string | undefined; limit?: number | undefined }): Promise<JobRecord[]> {
    const limit = options?.limit ?? 50;
    const query = db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit);
    if (options?.status) {
      return (await query.where(eq(jobs.status, options.status))) as JobRecord[];
    }
    return (await query) as JobRecord[];
  }

  /**
   * Awaits a job until it reaches 'completed' or 'dead'.
   */
  async waitForJob(id: string, options?: WaitForJobOptions): Promise<JobRecord> {
    const timeoutMs = options?.timeoutMs ?? 60_000;
    const pollIntervalMs = options?.pollIntervalMs ?? 500;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const job = await this.getJob(id);
      if (!job) {
        throw new Error(`Job ${id} not found`);
      }

      if (job.status === "completed") {
        return job;
      }

      if (job.status === "dead") {
        throw new Error(`Job ${id} failed permanently (Dead Letter Queue): ${job.lastError}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Timed out after ${timeoutMs}ms waiting for job ${id}`);
  }

  /**
   * Spawns a subtask linked to a parent job and optional traceId.
   */
  async spawnSubtask(parentJobId: string, input: EnqueueJobInput): Promise<EnqueueJobResult> {
    return await this.enqueue({
      ...input,
      parentJobId,
      traceId: input.traceId ?? parentJobId,
    });
  }

  /**
   * Lists child subtasks of a parent job.
   */
  async getSubtasks(parentJobId: string): Promise<JobRecord[]> {
    if (this.preferDirect) {
      try {
        return await this.getSubtasksDirect(parentJobId);
      } catch {
        // Fall back to HTTP
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/agent/tasks/${parentJobId}/subtasks`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch subtasks for ${parentJobId} (${res.status})`);
      }
      return (await res.json()) as JobRecord[];
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        return await this.getSubtasksDirect(parentJobId);
      }
      throw err;
    }
  }

  private async getSubtasksDirect(parentJobId: string): Promise<JobRecord[]> {
    return (await db.select().from(jobs).where(eq(jobs.parentJobId, parentJobId)).orderBy(desc(jobs.createdAt))) as JobRecord[];
  }

  /**
   * Retrieves all jobs belonging to an agent trace session.
   */
  async getTrace(traceId: string): Promise<JobRecord[]> {
    if (this.preferDirect) {
      try {
        return await this.getTraceDirect(traceId);
      } catch {
        // Fall back to HTTP
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/agent/traces/${traceId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch trace ${traceId} (${res.status})`);
      }
      return (await res.json()) as JobRecord[];
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        return await this.getTraceDirect(traceId);
      }
      throw err;
    }
  }

  private async getTraceDirect(traceId: string): Promise<JobRecord[]> {
    return (await db.select().from(jobs).where(eq(jobs.traceId, traceId)).orderBy(desc(jobs.createdAt))) as JobRecord[];
  }

  /**
   * Waits for all child subtasks of a parent job to complete.
   */
  async waitForSubtasks(
    parentJobId: string,
    options?: WaitForJobOptions,
  ): Promise<{ subtasks: JobRecord[]; allCompleted: boolean }> {
    const timeoutMs = options?.timeoutMs ?? 60_000;
    const pollIntervalMs = options?.pollIntervalMs ?? 500;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const subtasks = await this.getSubtasks(parentJobId);
      if (subtasks.length > 0) {
        const allFinished = subtasks.every(
          (t) => t.status === "completed" || t.status === "dead",
        );
        if (allFinished) {
          return { subtasks, allCompleted: true };
        }
      }
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    const subtasks = await this.getSubtasks(parentJobId);
    return {
      subtasks,
      allCompleted: subtasks.length > 0 && subtasks.every((t) => t.status === "completed" || t.status === "dead"),
    };
  }

  /**
   * Retrieves Dead Letter Queue (DLQ) records.
   */
  async listDeadJobs(): Promise<DeadJobRecord[]> {
    if (this.preferDirect) {
      try {
        return await this.listDeadJobsDirect();
      } catch {
        // Fall back to HTTP
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/dead-jobs`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to list dead jobs (${res.status})`);
      }
      return (await res.json()) as DeadJobRecord[];
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        return await this.listDeadJobsDirect();
      }
      throw err;
    }
  }

  private async listDeadJobsDirect(): Promise<DeadJobRecord[]> {
    return (await db.select().from(deadJobs).orderBy(desc(deadJobs.failedAt)).limit(50)) as DeadJobRecord[];
  }

  /**
   * Replays a dead job by ID.
   */
  async replayDeadJob(id: string): Promise<{ replayed: boolean; jobId: string }> {
    if (this.preferDirect) {
      try {
        return await this.replayDeadJobDirect(id);
      } catch {
        // Fall back to HTTP
      }
    }

    try {
      const res = await fetch(`${this.baseUrl}/dead-jobs/${id}/replay`, {
        method: "POST",
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to replay dead job ${id} (${res.status})`);
      }
      return (await res.json()) as { replayed: boolean; jobId: string };
    } catch (err: any) {
      if (this.isNetworkError(err)) {
        return await this.replayDeadJobDirect(id);
      }
      throw err;
    }
  }

  private async replayDeadJobDirect(id: string): Promise<{ replayed: boolean; jobId: string }> {
    const [deadRecord] = await db.select().from(deadJobs).where(eq(deadJobs.id, id));
    if (!deadRecord) {
      throw new Error(`Dead job record ${id} not found`);
    }
    const [replayed] = await db
      .insert(jobs)
      .values({
        type: deadRecord.type,
        payload: deadRecord.payload,
        status: "pending",
        attempts: 0,
        availableAt: new Date(),
      })
      .returning();
    await db.delete(deadJobs).where(eq(deadJobs.id, deadRecord.id));
    return { replayed: true, jobId: replayed!.id };
  }
}

export const beastMQ = new BeastMQClient();
