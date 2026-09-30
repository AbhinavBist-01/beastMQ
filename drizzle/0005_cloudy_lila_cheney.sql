ALTER TABLE "idempotency_keys" ADD COLUMN "locked_by" text;--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;