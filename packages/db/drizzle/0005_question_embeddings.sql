CREATE TABLE "question_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"exam_type_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"canonical_text_hash" text NOT NULL,
	"embedding" vector(384) NOT NULL,
	"embedding_model" text NOT NULL,
	"embedding_dim" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_embeddings_question_id_unique" UNIQUE ("question_id")
);
--> statement-breakpoint
ALTER TABLE "question_embeddings" ADD CONSTRAINT "question_embeddings_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_embeddings" ADD CONSTRAINT "question_embeddings_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_embeddings" ADD CONSTRAINT "question_embeddings_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "question_embeddings_scope_idx" ON "question_embeddings" USING btree ("exam_type_id","domain_id");--> statement-breakpoint
CREATE INDEX "question_embeddings_hnsw" ON "question_embeddings" USING hnsw ("embedding" vector_cosine_ops);
