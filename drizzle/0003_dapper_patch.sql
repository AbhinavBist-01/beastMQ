CREATE TABLE "dead_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"attempts" integer NOT NULL,
	"error" text,
	"failed_at" timestamp DEFAULT now() NOT NULL
);
