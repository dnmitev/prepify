CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "post_exam_training_item_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"summary_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_exam_training_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" uuid,
	"exam_type_code" text NOT NULL,
	"status" text NOT NULL,
	"teaching_text" text,
	"temporal_workflow_id" text NOT NULL,
	"error_message" text,
	"environment_label" text DEFAULT 'development' NOT NULL,
	"embedding_model" text,
	"embedding_dim" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_exam_training_item_summaries" ADD CONSTRAINT "post_exam_training_item_summaries_run_id_post_exam_training_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."post_exam_training_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_exam_training_item_summaries" ADD CONSTRAINT "post_exam_training_item_summaries_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_exam_training_runs" ADD CONSTRAINT "post_exam_training_runs_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "post_exam_training_item_summaries_run_question_idx" ON "post_exam_training_item_summaries" USING btree ("run_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_exam_training_runs_attempt_id_idx" ON "post_exam_training_runs" USING btree ("attempt_id");--> statement-breakpoint
CREATE TABLE "post_exam_training_embedding_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"chunk_index" integer DEFAULT 0 NOT NULL,
	"content_text" text NOT NULL,
	"embedding" vector(384) NOT NULL,
	"embedding_model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_exam_training_embedding_chunks_run_chunk_unique" UNIQUE ("run_id","chunk_index")
);
--> statement-breakpoint
ALTER TABLE "post_exam_training_embedding_chunks" ADD CONSTRAINT "post_exam_training_embedding_chunks_run_id_post_exam_training_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."post_exam_training_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_exam_training_embedding_chunks_hnsw" ON "post_exam_training_embedding_chunks" USING hnsw ("embedding" vector_cosine_ops);
