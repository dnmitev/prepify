ALTER TABLE "generation_jobs" ADD COLUMN "candidate_attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "duplicate_skipped_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE "generation_job_duplicate_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generation_job_id" uuid NOT NULL,
	"candidate_attempt_number" integer NOT NULL,
	"nearest_question_id" uuid,
	"similarity_score_bps" integer NOT NULL,
	"threshold_bps" integer NOT NULL,
	"canonical_text_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generation_job_duplicate_candidates" ADD CONSTRAINT "generation_job_duplicate_candidates_generation_job_id_generation_jobs_id_fk" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_job_duplicate_candidates" ADD CONSTRAINT "generation_job_duplicate_candidates_nearest_question_id_questions_id_fk" FOREIGN KEY ("nearest_question_id") REFERENCES "public"."questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "generation_job_duplicate_candidates_job_attempt_idx" ON "generation_job_duplicate_candidates" USING btree ("generation_job_id","candidate_attempt_number");--> statement-breakpoint
CREATE INDEX "generation_job_duplicate_candidates_job_idx" ON "generation_job_duplicate_candidates" USING btree ("generation_job_id");
