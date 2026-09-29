ALTER TABLE "jobs" ADD COLUMN "locked_by" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "locked_until" timestamp;