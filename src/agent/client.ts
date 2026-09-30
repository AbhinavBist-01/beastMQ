import type { EnqueueJobInput, EnqueueJobResult, JobRecord, DeadJobRecord } from "../core/types.js";

export interface WaitForJobOptions {
  timeoutMs?: number | undefined;
  pollIntervalMs?: number | undefined;
}

export class BeastMQClient {
  private baseUrl: string;
  private apiKey?: string | undefined;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = (baseUrl || process.env.BEASTMQ_URL || process.env.BEASTM_URL || "http://localhost:3000").replace(/\/$/, "");
    this.apiKey = apiKey || process.env.BEASTMQ_API_KEY;
  }

  private getHeaders(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { ...extra };
    if (this.apiKey) {
      headers["x-api-key"] = this.apiKey;
    }
    return headers;
  }

  /**
   * Enqueues a new background job or agent task.
   */
  async enqueue(input: EnqueueJobInput): Promise<EnqueueJobResult> {
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
  }

  /**
   * Fetches job metadata, status, and result by ID.
   */
  async getJob(id: string): Promise<JobRecord | null> {
    const res = await fetch(`${this.baseUrl}/jobs/${id}`, {
      headers: this.getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Failed to fetch job ${id} (${res.status})`);
    }
    return (await res.json()) as JobRecord;
  }

  /**
   * Queries list of jobs with optional status filter.
   */
  async listJobs(options?: { status?: string | undefined; limit?: number | undefined }): Promise<JobRecord[]> {
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
    const res = await fetch(`${this.baseUrl}/agent/tasks/${parentJobId}/subtasks`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch subtasks for ${parentJobId} (${res.status})`);
    }
    return (await res.json()) as JobRecord[];
  }

  /**
   * Retrieves Dead Letter Queue (DLQ) records.
   */
  async listDeadJobs(): Promise<DeadJobRecord[]> {
    const res = await fetch(`${this.baseUrl}/dead-jobs`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to list dead jobs (${res.status})`);
    }
    return (await res.json()) as DeadJobRecord[];
  }

  /**
   * Replays a dead job by ID.
   */
  async replayDeadJob(id: string): Promise<{ replayed: boolean; jobId: string }> {
    const res = await fetch(`${this.baseUrl}/dead-jobs/${id}/replay`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to replay dead job ${id} (${res.status})`);
    }
    return (await res.json()) as { replayed: boolean; jobId: string };
  }
}

export const beastMQ = new BeastMQClient();
