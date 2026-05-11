CREATE TABLE "attempt_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"is_unscored" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_type_id" uuid NOT NULL,
	"status" text NOT NULL,
	"remaining_active_seconds" integer NOT NULL,
	"last_activity_at" timestamp with time zone NOT NULL,
	"paused_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"scaled_score" integer,
	"passed" boolean
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_type_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"weight_percent" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"unscored_count" integer NOT NULL,
	"passing_scaled_score" integer NOT NULL,
	CONSTRAINT "exam_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"temporal_workflow_id" text NOT NULL,
	"status" text NOT NULL,
	"topic" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"environment_label" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"role" text NOT NULL,
	"workflow_id" text,
	"job_id" uuid,
	"activity_name" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"explanation" text
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_type_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"stem" text NOT NULL,
	"format" text NOT NULL,
	"provenance" text DEFAULT 'seed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_positions" jsonb NOT NULL,
	CONSTRAINT "responses_attempt_id_question_id_pk" PRIMARY KEY("attempt_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_items" ADD CONSTRAINT "attempt_items_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_items_attempt_position_idx" ON "attempt_items" USING btree ("attempt_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "domains_exam_code_idx" ON "domains" USING btree ("exam_type_id","code");