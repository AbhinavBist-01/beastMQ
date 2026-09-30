import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const concurrency = parseInt(process.env.CONCURRENCY || "5", 10);
const maxPool = parseInt(
  process.env.MAX_POOL_SIZE || String(Math.max(20, concurrency * 2 + 10)),
  10,
);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: maxPool,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export const db = drizzle({ client: pool, schema });
export { schema };
