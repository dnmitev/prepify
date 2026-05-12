import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const examTypes = pgTable("exam_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  unscoredCount: integer("unscored_count").notNull(),
  passingScaledScore: integer("passing_scaled_score").notNull(),
});

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    examTypeId: uuid("exam_type_id")
      .notNull()
      .references(() => examTypes.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    weightPercent: integer("weight_percent").notNull(),
  },
  (t) => ({
    examDomainIdx: uniqueIndex("domains_exam_code_idx").on(t.examTypeId, t.code),
  }),
);

export const generationJobs = pgTable("generation_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  temporalWorkflowId: text("temporal_workflow_id").notNull(),
  status: text("status").notNull(), // queued | running | succeeded | failed
  topic: text("topic"),
  examTypeCode: text("exam_type_code"),
  topicHint: text("topic_hint"),
  targetQuestionCount: integer("target_question_count").notNull().default(1),
  completedQuestionCount: integer("completed_question_count").notNull().default(0),
  candidateAttemptCount: integer("candidate_attempt_count").notNull().default(0),
  duplicateSkippedCount: integer("duplicate_skipped_count").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  examTypeId: uuid("exam_type_id")
    .notNull()
    .references(() => examTypes.id, { onDelete: "cascade" }),
  domainId: uuid("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "restrict" }),
  stem: text("stem").notNull(),
  format: text("format").notNull(), // single | multiple
  provenance: text("provenance").notNull().default("seed"),
  generationJobId: uuid("generation_job_id").references(() => generationJobs.id, {
    onDelete: "set null",
  }),
});

export const questionOptions = pgTable("question_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  explanation: text("explanation"),
});

export const generationJobDuplicateCandidates = pgTable(
  "generation_job_duplicate_candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    generationJobId: uuid("generation_job_id")
      .notNull()
      .references(() => generationJobs.id, { onDelete: "cascade" }),
    candidateAttemptNumber: integer("candidate_attempt_number").notNull(),
    nearestQuestionId: uuid("nearest_question_id").references(() => questions.id, {
      onDelete: "set null",
    }),
    similarityScoreBps: integer("similarity_score_bps").notNull(),
    thresholdBps: integer("threshold_bps").notNull(),
    canonicalTextHash: text("canonical_text_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqJobAttempt: uniqueIndex("generation_job_duplicate_candidates_job_attempt_idx").on(
      t.generationJobId,
      t.candidateAttemptNumber,
    ),
    jobIdx: index("generation_job_duplicate_candidates_job_idx").on(t.generationJobId),
  }),
);

export const attempts = pgTable("attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  examTypeId: uuid("exam_type_id")
    .notNull()
    .references(() => examTypes.id, { onDelete: "restrict" }),
  status: text("status").notNull(), // active | paused | submitted | expired
  remainingActiveSeconds: integer("remaining_active_seconds").notNull(),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull(),
  pausedAt: timestamp("paused_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  scaledScore: integer("scaled_score"),
  passed: boolean("passed"),
});

export const attemptItems = pgTable(
  "attempt_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    isUnscored: boolean("is_unscored").notNull(),
  },
  (t) => ({
    uniqAttemptPos: uniqueIndex("attempt_items_attempt_position_idx").on(t.attemptId, t.position),
  }),
);

export const responses = pgTable(
  "responses",
  {
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    selectedPositions: jsonb("selected_positions").$type<number[]>().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.attemptId, t.questionId] }),
  }),
);

export const llmUsageEvents = pgTable("llm_usage_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  environmentLabel: text("environment_label").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  role: text("role").notNull(),
  workflowId: text("workflow_id"),
  jobId: uuid("job_id"),
  activityName: text("activity_name"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  totalTokens: integer("total_tokens"),
});

/** One row per finalized attempt selected for post-exam AI training (English-only content). */
export const postExamTrainingRuns = pgTable(
  "post_exam_training_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    /** Optional future learner key; null for anonymous practice. */
    userId: uuid("user_id"),
    examTypeCode: text("exam_type_code").notNull(),
    status: text("status").notNull(), // pending | summarizing | teaching | embedding | succeeded | failed
    teachingText: text("teaching_text"),
    temporalWorkflowId: text("temporal_workflow_id").notNull(),
    errorMessage: text("error_message"),
    environmentLabel: text("environment_label").notNull().default("development"),
    embeddingModel: text("embedding_model"),
    embeddingDim: integer("embedding_dim"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqAttempt: uniqueIndex("post_exam_training_runs_attempt_id_idx").on(t.attemptId),
  }),
);

export const postExamTrainingItemSummaries = pgTable(
  "post_exam_training_item_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id")
      .notNull()
      .references(() => postExamTrainingRuns.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    summaryText: text("summary_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqRunQuestion: uniqueIndex("post_exam_training_item_summaries_run_question_idx").on(
      t.runId,
      t.questionId,
    ),
  }),
);
