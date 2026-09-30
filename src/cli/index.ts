#!/usr/bin/env node
import "dotenv/config";
import { BeastMQClient } from "../agent/client.js";

const client = new BeastMQClient();

function printHelp() {
  console.log(`
⚡ beastMQ CLI - Agentic Task Queue & Worker

Usage:
  npx beastmq <command> [options]

Commands:
  enqueue                 Enqueue a new job or agent task
    --type <type>           (required) Job routing type (e.g. agent.search)
    --payload '<json>'      (required) JSON payload string
    --priority <number>     (optional) Priority weighting (higher = sooner)
    --idempotency-key <key> (optional) Deduplication key
    --trace-id <id>         (optional) Trace correlation ID
    --parent-id <id>        (optional) Parent job ID for subagents
    --role <name>           (optional) Agent role name

  status <jobId>          Get status and result of a job

  wait <jobId>            Wait until a job completes and output its result
    --timeout <ms>          Max wait time (default: 60000ms)
    --interval <ms>         Polling interval (default: 500ms)

  list                    List recent jobs
    --status <status>       Filter by status (pending|running|completed|dead)
    --limit <number>        Limit count (default: 20)

  dlq list                List dead letter queue jobs
  dlq replay <deadJobId>  Replay a dead job back to pending status

  worker                  Start a background worker process
    --concurrency <number>  Number of concurrent fibers (default: 5)
    --drain                 Process all pending jobs until queue is empty, then exit

  help                    Show this help message
`);
}

function parseArgs(args: string[]): { command: string; subCommand?: string | undefined; flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  let command = "";
  let subCommand: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = "true";
      }
    } else {
      if (!command) {
        command = arg;
      } else if (!subCommand && (command === "dlq")) {
        subCommand = arg;
      } else {
        positional.push(arg);
      }
    }
  }

  return { command, subCommand, flags, positional };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const { command, subCommand, flags, positional } = parseArgs(args);

  try {
    switch (command) {
      case "enqueue": {
        const type = flags.type;
        const payloadRaw = flags.payload;
        if (!type || !payloadRaw) {
          console.error("Error: --type and --payload are required for enqueue.");
          process.exit(1);
        }

        let payload: unknown;
        try {
          payload = JSON.parse(payloadRaw);
        } catch {
          payload = payloadRaw;
        }

        const priority = flags.priority ? parseInt(flags.priority, 10) : undefined;
        const idempotencyKey = flags["idempotency-key"];
        const traceId = flags["trace-id"];
        const parentJobId = flags["parent-id"];
        const agentRole = flags.role;

        const res = await client.enqueue({
          type,
          payload,
          priority,
          idempotencyKey,
          traceId,
          parentJobId,
          agentRole,
        });

        console.log(JSON.stringify(res, null, 2));
        break;
      }

      case "status": {
        const id = positional[0];
        if (!id) {
          console.error("Error: jobId is required. Usage: npx beastmq status <jobId>");
          process.exit(1);
        }

        const job = await client.getJob(id);
        if (!job) {
          console.error(`Error: Job ${id} not found.`);
          process.exit(1);
        }

        console.log(JSON.stringify(job, null, 2));
        break;
      }

      case "wait": {
        const id = positional[0];
        if (!id) {
          console.error("Error: jobId is required. Usage: npx beastmq wait <jobId>");
          process.exit(1);
        }

        const timeoutMs = flags.timeout ? parseInt(flags.timeout, 10) : 60_000;
        const pollIntervalMs = flags.interval ? parseInt(flags.interval, 10) : 500;

        console.log(`Waiting for job ${id}...`);
        const job = await client.waitForJob(id, { timeoutMs, pollIntervalMs });
        console.log(JSON.stringify({ id: job.id, status: job.status, result: job.result }, null, 2));
        break;
      }

      case "list": {
        const status = flags.status;
        const limit = flags.limit ? parseInt(flags.limit, 10) : 20;

        const jobs = await client.listJobs({ status, limit });
        console.log(JSON.stringify(jobs, null, 2));
        break;
      }

      case "dlq": {
        if (subCommand === "list" || !subCommand) {
          const deadList = await client.listDeadJobs();
          console.log(JSON.stringify(deadList, null, 2));
        } else if (subCommand === "replay") {
          const id = positional[0];
          if (!id) {
            console.error("Error: deadJobId required. Usage: npx beastmq dlq replay <deadJobId>");
            process.exit(1);
          }
          const res = await client.replayDeadJob(id);
          console.log(JSON.stringify(res, null, 2));
        } else {
          console.error(`Unknown DLQ command: ${subCommand}`);
          process.exit(1);
        }
        break;
      }

      case "worker": {
        const concurrency = flags.concurrency ? parseInt(flags.concurrency, 10) : undefined;
        const isDrain = flags.drain === "true" || flags.once === "true";
        const { WorkerRunner } = await import("../worker/runner.js");
        const runner = new WorkerRunner({ concurrency });
        if (isDrain) {
          const count = await runner.drain();
          console.log(JSON.stringify({ status: "drained", processedCount: count }));
        } else {
          await runner.start();
        }
        break;
      }

      case "help": {
        printHelp();
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err: any) {
    console.error("Error executing beastMQ command:", err.message ?? err);
    process.exit(1);
  }
}

main();
