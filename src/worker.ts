import { WorkerRunner } from "./worker/runner.js";
import { pool } from "./db/index.js";
import "./worker/shutdown.js";

export * from "./worker/runner.js";
export * from "./worker/shutdown.js";

const runner = new WorkerRunner();

runner
  .start()
  .catch((err) => {
    console.error("Worker fatal error:", err);
  })
  .finally(async () => {
    try {
      await pool.end();
    } catch {}
    process.exit(0);
  });
