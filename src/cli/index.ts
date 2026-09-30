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

  subtasks <parentId>     List all child subtasks spawned by a parent job
  wait-subtasks <parentId> Wait until all child subtasks complete
    --timeout <ms>          Max wait time (default: 60000ms)

  trace <traceId>         List all jobs belonging to an agent trace session

  dlq list                List dead letter queue jobs
  dlq replay <deadJobId>  Replay a dead job back to pending status

  worker                  Start a background worker process
    --concurrency <number>  Number of concurrent fibers (default: 5)
    --drain                 Process all pending jobs until queue is empty, then exit

  keygen                  Generate a secure API key (pass --save to write to .env)

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
      if (key === "payload" || key === "data" || key === "cmd" || key === "command") {
        const parts: string[] = [];
        while (i + 1 < args.length && !args[i + 1]!.startsWith("--")) {
          parts.push(args[i + 1]!);
          i++;
        }
        flags[key] = parts.join(" ");
      } else {
        const next = args[i + 1];
        if (next && !next.startsWith("--")) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = "true";
        }
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
        let type = flags.type;
        let payloadRaw = flags.payload || flags.data;

        if (!type && (flags.cmd || flags.command)) {
          type = "agent.command";
        }
        if (!type && flags.url) {
          type = "agent.http";
        }
        if (!payloadRaw && (flags.cmd || flags.command)) {
          payloadRaw = JSON.stringify({
            command: flags.cmd || flags.command,
            cwd: flags.cwd,
          });
        }
        if (!payloadRaw && flags.url) {
          payloadRaw = JSON.stringify({
            url: flags.url,
            method: flags.method ?? "GET",
          });
        }

        if (!type || !payloadRaw) {
          console.error("Error: --type and --payload (or --cmd / --url) are required for enqueue.");
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
        process.exit(0);
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
        process.exit(0);
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
        process.exit(0);
      }

      case "list": {
        const status = flags.status;
        const limit = flags.limit ? parseInt(flags.limit, 10) : 20;

        const jobs = await client.listJobs({ status, limit });
        console.log(JSON.stringify(jobs, null, 2));
        process.exit(0);
      }

      case "subtasks": {
        const parentId = positional[0];
        if (!parentId) {
          console.error("Error: parentId is required. Usage: npx beastmq subtasks <parentId>");
          process.exit(1);
        }

        const subtasks = await client.getSubtasks(parentId);
        console.log(JSON.stringify(subtasks, null, 2));
        process.exit(0);
      }

      case "wait-subtasks": {
        const parentId = positional[0];
        if (!parentId) {
          console.error("Error: parentId is required. Usage: npx beastmq wait-subtasks <parentId>");
          process.exit(1);
        }

        const timeoutMs = flags.timeout ? parseInt(flags.timeout, 10) : 60_000;
        console.log(`Waiting for subtasks of ${parentId}...`);
        const result = await client.waitForSubtasks(parentId, { timeoutMs });
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      }

      case "trace": {
        const traceId = positional[0];
        if (!traceId) {
          console.error("Error: traceId is required. Usage: npx beastmq trace <traceId>");
          process.exit(1);
        }

        const jobs = await client.getTrace(traceId);
        console.log(JSON.stringify(jobs, null, 2));
        process.exit(0);
      }

      case "dlq": {
        if (subCommand === "list" || !subCommand) {
          const deadList = await client.listDeadJobs();
          console.log(JSON.stringify(deadList, null, 2));
          process.exit(0);
        } else if (subCommand === "replay") {
          const id = positional[0];
          if (!id) {
            console.error("Error: deadJobId required. Usage: npx beastmq dlq replay <deadJobId>");
            process.exit(1);
          }
          const res = await client.replayDeadJob(id);
          console.log(JSON.stringify(res, null, 2));
          process.exit(0);
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
          process.exit(0);
        } else {
          await runner.start();
        }
        break;
      }

      case "keygen": {
        const crypto = await import("node:crypto");
        const key = `bmq_live_${crypto.randomBytes(24).toString("hex")}`;
        const saveToEnv = flags.save === "true";
        if (saveToEnv) {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const envPath = path.resolve(process.cwd(), ".env");
          let content = "";
          if (fs.existsSync(envPath)) {
            content = fs.readFileSync(envPath, "utf-8");
          }
          if (content.includes("BEASTMQ_API_KEY=")) {
            content = content.replace(/BEASTMQ_API_KEY=.*/, `BEASTMQ_API_KEY="${key}"`);
          } else {
            content += `\nBEASTMQ_API_KEY="${key}"\n`;
          }
          fs.writeFileSync(envPath, content);
          console.log(`\n🔑 Generated and saved BeastMQ Secret API Key to .env:\n\n  ${key}\n`);
        } else {
          console.log(`\n🔑 Generated BeastMQ Secret API Key:\n\n  ${key}\n`);
          console.log(`To activate, add to your .env file:`);
          console.log(`  BEASTMQ_API_KEY="${key}"\n`);
          console.log(`(Tip: pass --save to automatically write it to your .env file)\n`);
        }
        process.exit(0);
      }

      case "help": {
        printHelp();
        process.exit(0);
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
