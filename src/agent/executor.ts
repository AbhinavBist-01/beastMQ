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

    if (job.type === "agent.command" || job.type === "agent.shell") {
      const { exec } = await import("node:child_process");
      const cmdPayload = (job.payload ?? {}) as { command?: string; cwd?: string };
      if (!cmdPayload.command) {
        throw new Error("Missing 'command' in payload for agent.command");
      }
      const startTime = Date.now();
      return await new Promise((resolve) => {
        const child = exec(
          cmdPayload.command!,
          {
            cwd: cmdPayload.cwd ?? process.cwd(),
            signal: controller.signal,
          },
          (err, stdout, stderr) => {
            const durationMs = Date.now() - startTime;
            if (err && !controller.signal.aborted) {
              return resolve({
                exitCode: child.exitCode ?? 1,
                stdout: stdout?.toString() ?? "",
                stderr: stderr?.toString() ?? err.message,
                durationMs,
                error: err.message,
              });
            }
            resolve({
              exitCode: child.exitCode ?? 0,
              stdout: stdout?.toString() ?? "",
              stderr: stderr?.toString() ?? "",
              durationMs,
            });
          },
        );
      });
    }

    if (job.type === "agent.http" || job.type === "agent.fetch") {
      const httpPayload = (job.payload ?? {}) as {
        url?: string;
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
      };
      if (!httpPayload.url) {
        throw new Error("Missing 'url' in payload for agent.http");
      }
      const startTime = Date.now();
      const reqInit: RequestInit = {
        method: httpPayload.method ?? "GET",
        signal: controller.signal,
      };
      if (httpPayload.headers) {
        reqInit.headers = httpPayload.headers;
      }
      if (httpPayload.body !== undefined) {
        reqInit.body = typeof httpPayload.body === "string" ? httpPayload.body : JSON.stringify(httpPayload.body);
      }
      const res = await fetch(httpPayload.url, reqInit);
      const durationMs = Date.now() - startTime;
      const contentType = res.headers.get("content-type") ?? "";
      let data: unknown;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      return {
        status: res.status,
        ok: res.ok,
        data,
        durationMs,
      };
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
