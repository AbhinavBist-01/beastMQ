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

  attempts: integer("attempts").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),

  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
