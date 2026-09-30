import { db } from "../db/index.js";
import { jobs } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";
import type { EnqueueJobInput, JobRecord } from "../core/types.js";

export interface SubagentTaskSpec<T = any> {
  type: string;
  payload: T;
  agentRole?: string;
  priority?: number;
  idempotencyKey?: string;
}

export class AgentWorkflow {
  /**
   * Spawns multiple subagent tasks in parallel linked to a parent job and trace.
   */
  static async spawnSubtasks(
    parentJobId: string,
    traceId: string | undefined,
    tasks: SubagentTaskSpec[],
  ): Promise<JobRecord[]> {
    if (tasks.length === 0) return [];

    const insertValues = tasks.map((t) => ({
      type: t.type,
      payload: t.payload,
      priority: t.priority ?? 0,
      idempotencyKey: t.idempotencyKey,
      parentJobId,
      traceId: traceId ?? parentJobId,
      agentRole: t.agentRole,
    }));

    return await db.insert(jobs).values(insertValues).returning();
  }

  /**
   * Awaits all subagent tasks for a parent job to complete.
   */
  static async getSubtaskStatuses(parentJobId: string): Promise<JobRecord[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.parentJobId, parentJobId));
  }

  /**
   * Queries all jobs belonging to an agent trace session.
   */
  static async getTraceJobs(traceId: string): Promise<JobRecord[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.traceId, traceId));
  }
}
