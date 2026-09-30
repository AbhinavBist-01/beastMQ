import type { InferSelectModel } from "drizzle-orm";
import type { jobs, deadJobs, idempotencyKeys } from "../db/schema.js";

export type JobRecord = InferSelectModel<typeof jobs>;
export type DeadJobRecord = InferSelectModel<typeof deadJobs>;
export type IdempotencyRecord = InferSelectModel<typeof idempotencyKeys>;

export type JobStatus = "pending" | "running" | "completed" | "dead";

export interface EnqueueJobInput {
  type: string;
  payload: unknown;
  priority?: number | undefined;
  idempotencyKey?: string | undefined;
  traceId?: string | undefined;
  parentJobId?: string | undefined;
  agentRole?: string | undefined;
}

export interface EnqueueJobResult {
  id: string;
  status: JobStatus;
  duplicate?: boolean | undefined;
}

export interface ClaimJobOptions {
  workerId: string;
  leaseDurationMs: number;
}
