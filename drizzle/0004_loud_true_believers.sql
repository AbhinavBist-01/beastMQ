CREATE TABLE "idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_idempotency_key_unique" UNIQUE("idempotency_key");