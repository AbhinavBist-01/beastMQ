import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 255 }).notNull(),
  priority: integer("priority").notNull().default(0),

  payload: jsonb("payload").notNull(),

  status: text("status").notNull().default("pending"),
  lockedBy: text("locked_by"),
  lockedUntil: timestamp("locked_until"),
  idempotencyKey: text("idempotency_key").unique(),
  availableAt: timestamp("available_at").notNull().defaultNow(),
  attempts: integer("attempts").notNull().default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  // Agentic Context & Execution
  traceId: text("trace_id"),
  parentJobId: uuid("parent_job_id"),
  agentRole: text("agent_role"),
  result: jsonb("result"),

  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),

  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deadJobs = pgTable("dead_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),

  jobId: uuid("job_id").notNull(),

  type: text("type").notNull(),

  payload: jsonb("payload").notNull(),

  attempts: integer("attempts").notNull(),

  error: text("error"),

  failedAt: timestamp("failed_at").notNull().defaultNow(),
});

export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(),

  status: text("status").notNull().default("processing"),

  result: jsonb("result"),

  lockedBy: text("locked_by"),

  lockedUntil: timestamp("locked_until"),

  createdAt: timestamp("created_at").notNull().defaultNow(),

  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
