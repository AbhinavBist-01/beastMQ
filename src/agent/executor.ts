import type { JobRecord } from "../core/types.js";
import type { AgentTaskContext } from "./context.js";
import { taskRegistry } from "./registry.js";

export async function executeJob(
  job: JobRecord,
  jobTimeoutMs: number = 30_000,
): Promise<unknown> {
  const controller = new AbortController();

  const context: AgentTaskContext = {
    jobId: job.id,
    type: job.type,
    traceId: job.traceId,
    parentJobId: job.parentJobId,
    agentRole: job.agentRole,
    attempts: job.attempts,
    startedAt: job.startedAt,
    signal: controller.signal,
  };

  const handler = taskRegistry.get(job.type);

  const executionPromise = (async () => {
    if (handler) {
      return await handler(job.payload, context);
    }

    // Default execution behavior (supports simulation & tests)
    const payload = job.payload as {
      durationMs?: number;
      shouldFail?: boolean;
      errorMessage?: string;
      echo?: unknown;
    } | null;

    if (payload?.shouldFail) {
      throw new Error(payload.errorMessage ?? "Job forced failure");
    }

    const duration = payload?.durationMs ?? 1000;
    if (duration > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, duration);
        controller.signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(controller.signal.reason);
        }, { once: true });
      });
    }

    return payload?.echo ?? { executedAt: new Date().toISOString(), durationMs: duration };
  })();

  let timeoutTimer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutTimer = setTimeout(() => {
      const timeoutError = new Error("Job execution timeout");
      controller.abort(timeoutError);
      reject(timeoutError);
    }, jobTimeoutMs);
  });

  try {
    return await Promise.race([executionPromise, timeoutPromise]);
  } finally {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
    }
  }
}
