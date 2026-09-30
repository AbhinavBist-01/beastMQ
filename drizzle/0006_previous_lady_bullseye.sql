ALTER TABLE "jobs" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "last_error" text;