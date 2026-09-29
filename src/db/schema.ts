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

  payload: jsonb("payload").notNull(),

  status: text("status").notNull().default("pending"),
  lockedBy: text("locked_by"),
  lockedUntil: timestamp("locked_until"),

  availableAt: timestamp("available_at").notNull().defaultNow(),

  attempts: integer("attempts").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),

  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
