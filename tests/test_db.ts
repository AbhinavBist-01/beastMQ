import { db, pool } from "../src/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  const r = await db.execute(sql`SELECT conname, contype FROM pg_constraint WHERE conrelid = 'jobs'::regclass;`);
  console.log("Constraints:", r.rows);
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
