ALTER TABLE "jobs" ADD COLUMN "trace_id" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "parent_job_id" uuid;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "agent_role" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "result" jsonb;