import { and, asc, eq } from "drizzle-orm";
import {
  domains,
  examTypes,
  generationJobs,
  insertQuestionEmbedding,
  QUESTION_EMBEDDING_DIMENSION,
  questionOptions,
  questions,
  recordQuestionGenerationCandidateAttempt,
  recordSkippedDuplicateQuestionCandidate,
  searchQuestionEmbeddingNeighbors,
} from "@prepify/db";
import {
  buildGeneratedQuestionCanonicalText,
  decideQuestionDuplicate,
  questionDuplicateThresholdConfigFromEnv,
  validateGeneratedQuestionPayload,
} from "@prepify/shared";
import { createHash } from "node:crypto";

import { workerDb } from "./db-client.js";
import { embedText } from "./embeddings.js";
import { recordLlmUsage } from "./llm-usage.js";
import { runQuestionGenerationModel } from "./question-generation.js";

async function failJob(jobId: string, message: string): Promise<void> {
  await workerDb()
    .update(generationJobs)
    .set({
      status: "failed",
      errorMessage: message.slice(0, 4000),
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobId));
}

function roleConfig(role: "summarization" | "question_generation" | "embedding") {
  if (role === "embedding") {
    return {
      provider: process.env["LLM_ROLE_EMBEDDING_PROVIDER"] ?? "mock",
      model: process.env["LLM_ROLE_EMBEDDING_MODEL"] ?? "bge-small-en-v1.5",
    };
  }
  const providerEnv =
    role === "summarization"
      ? process.env["LLM_ROLE_SUMMARIZATION_PROVIDER"]
      : process.env["LLM_ROLE_QUESTION_GENERATION_PROVIDER"];
  const modelEnv =
    role === "summarization"
      ? process.env["LLM_ROLE_SUMMARIZATION_MODEL"]
      : process.env["LLM_ROLE_QUESTION_GENERATION_MODEL"];
  return {
    provider: providerEnv ?? "mock",
    model: modelEnv ?? (role === "summarization" ? "mock-mini" : "mock-large"),
  };
}

function hashCanonicalQuestionText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export async function summarizeTopic(input: {
  jobId: string;
  topic: string;
  examTypeCode: string;
  environmentLabel: string;
  workflowId: string;
}): Promise<string> {
  const cfg = roleConfig("summarization");
  await workerDb()
    .update(generationJobs)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(generationJobs.id, input.jobId));

  await recordLlmUsage(workerDb(), {
    jobId: input.jobId,
    environmentLabel: input.environmentLabel,
    provider: cfg.provider,
    model: cfg.model,
    role: "summarization",
    workflowId: input.workflowId,
    activityName: "summarizeTopic",
    inputTokens: 24,
    outputTokens: 16,
  });

  return `Summary for "${input.topic}" on ${input.examTypeCode} (mock summarization).`;
}

export async function loadQuestionGenerationDedupeConfig(): Promise<{
  maxAttemptMultiplier: number;
}> {
  const cfg = questionDuplicateThresholdConfigFromEnv(process.env);
  return { maxAttemptMultiplier: cfg.maxAttemptMultiplier };
}

export async function markQuestionGenerationAttemptLimit(input: {
  jobId: string;
  targetQuestionCount: number;
  acceptedQuestionCount: number;
  candidateAttemptCount: number;
}): Promise<void> {
  await workerDb()
    .update(generationJobs)
    .set({
      status: "failed",
      completedQuestionCount: input.acceptedQuestionCount,
      candidateAttemptCount: input.candidateAttemptCount,
      errorMessage:
        `Generation stopped after ${String(input.candidateAttemptCount)} candidate attempts ` +
        `with ${String(input.acceptedQuestionCount)} accepted of ${String(input.targetQuestionCount)} requested questions.`,
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, input.jobId));
}

export async function generateQuestionItem(input: {
  jobId: string;
  examTypeCode: string;
  topicHint: string | null;
  summarize: boolean;
  summaryFromSummarization: string | null;
  environmentLabel: string;
  workflowId: string;
  questionCount: number;
  iterationIndex: number;
  acceptedQuestionIndex?: number;
  candidateAttemptNumber?: number;
}): Promise<
  | { ok: true; questionId: string }
  | {
      ok: false;
      reason: "duplicate";
      nearestQuestionId: string | null;
      similarity: number;
    }
> {
  const cfg = roleConfig("question_generation");
  const embedCfg = roleConfig("embedding");

  try {
    const db = workerDb();
    const acceptedQuestionIndex = input.acceptedQuestionIndex ?? input.iterationIndex;
    const candidateAttemptNumber = input.candidateAttemptNumber ?? input.iterationIndex + 1;

    if (!input.summarize) {
      await db
        .update(generationJobs)
        .set({ status: "running", updatedAt: new Date() })
        .where(eq(generationJobs.id, input.jobId));
    }

    const exam = (await db.select().from(examTypes).where(eq(examTypes.code, input.examTypeCode)))[0];
    if (!exam) {
      throw new Error(`Exam type "${input.examTypeCode}" not found — run migrations and seed.`);
    }

    const domainRows = await db
      .select({
        code: domains.code,
        name: domains.name,
        weightPercent: domains.weightPercent,
      })
      .from(domains)
      .where(eq(domains.examTypeId, exam.id))
      .orderBy(asc(domains.code));

    const allowedCodes = domainRows.map((d) => d.code);
    if (allowedCodes.length === 0) {
      throw new Error(`No domains configured for exam "${input.examTypeCode}".`);
    }

    const { raw, inputTokens, outputTokens } = await runQuestionGenerationModel({
      examTypeCode: input.examTypeCode,
      examName: exam.name,
      domains: domainRows,
      topicHint: input.topicHint,
      summaryBlock: input.summaryFromSummarization,
      provider: cfg.provider,
      model: cfg.model,
      iterationIndex: input.iterationIndex,
      questionCount: input.questionCount,
    });

    await recordLlmUsage(db, {
      jobId: input.jobId,
      environmentLabel: input.environmentLabel,
      provider: cfg.provider,
      model: cfg.model,
      role: "question_generation",
      workflowId: input.workflowId,
      activityName: "generateQuestionItem",
      inputTokens,
      outputTokens,
    });

    const parsed = validateGeneratedQuestionPayload(raw, { allowedDomainCodes: allowedCodes });
    if (!parsed.ok) {
      throw new Error(`Generation validation failed: ${parsed.errors.join("; ")}`);
    }

    const domainRow = (
      await db
        .select()
        .from(domains)
        .where(and(eq(domains.examTypeId, exam.id), eq(domains.code, parsed.value.domainCode)))
    )[0];
    if (!domainRow) {
      throw new Error(`Domain ${parsed.value.domainCode} not found`);
    }

    const sortedOpts = [...parsed.value.options].sort((a, b) => a.position - b.position);
    const canonicalText = buildGeneratedQuestionCanonicalText({
      examTypeCode: input.examTypeCode,
      domainCode: parsed.value.domainCode,
      stem: parsed.value.stem,
      format: parsed.value.format,
      options: sortedOpts,
    });
    const canonicalTextHash = hashCanonicalQuestionText(canonicalText);

    await recordQuestionGenerationCandidateAttempt(db, {
      jobId: input.jobId,
      candidateAttemptNumber,
    });

    const { embedding, inputTokens: embeddingInputTokens } = await embedText({
      text: canonicalText,
      provider: embedCfg.provider,
      model: embedCfg.model,
      expectedDimension: QUESTION_EMBEDDING_DIMENSION,
      context: "questionEmbedding",
    });

    await recordLlmUsage(db, {
      jobId: input.jobId,
      environmentLabel: input.environmentLabel,
      provider: embedCfg.provider,
      model: embedCfg.model,
      role: "question_deduplication_embedding",
      workflowId: input.workflowId,
      activityName: "generateQuestionItem",
      inputTokens: embeddingInputTokens,
      outputTokens: 0,
    });

    const nearest = (
      await searchQuestionEmbeddingNeighbors(db, {
        examTypeId: exam.id,
        domainId: domainRow.id,
        embedding,
        limit: 1,
      })
    )[0];
    const thresholds = questionDuplicateThresholdConfigFromEnv(process.env);
    const decision = decideQuestionDuplicate({
      similarity: nearest?.similarity ?? 0,
      hardThreshold: thresholds.hardThreshold,
      reviewThreshold: thresholds.reviewThreshold,
    });

    if (decision.kind === "hard_duplicate") {
      await recordSkippedDuplicateQuestionCandidate(db, {
        jobId: input.jobId,
        candidateAttemptNumber,
        nearestQuestionId: nearest?.questionId ?? null,
        similarity: decision.similarity,
        threshold: decision.hardThreshold,
        canonicalTextHash,
      });
      return {
        ok: false,
        reason: "duplicate",
        nearestQuestionId: nearest?.questionId ?? null,
        similarity: decision.similarity,
      };
    }

    const [qRow] = await db
      .insert(questions)
      .values({
        examTypeId: exam.id,
        domainId: domainRow.id,
        stem: parsed.value.stem,
        format: parsed.value.format,
        provenance: "ai-generated",
        generationJobId: input.jobId,
      })
      .returning();

    await db.insert(questionOptions).values(
      sortedOpts.map((o) => ({
        questionId: qRow!.id,
        position: o.position,
        text: o.text,
        isCorrect: o.isCorrect,
        explanation: o.explanation ?? null,
      })),
    );

    await insertQuestionEmbedding(db, {
      questionId: qRow!.id,
      examTypeId: exam.id,
      domainId: domainRow.id,
      canonicalTextHash,
      embedding,
      embeddingModel: embedCfg.model,
    });

    await db
      .update(generationJobs)
      .set({
        completedQuestionCount: acceptedQuestionIndex + 1,
        status: acceptedQuestionIndex + 1 >= input.questionCount ? "succeeded" : "running",
        updatedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(generationJobs.id, input.jobId));

    return { ok: true, questionId: qRow!.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await failJob(input.jobId, msg);
    throw e;
  }
}

export {
  postExamTrainingEmbedActivity,
  postExamTrainingPrepareActivity,
  postExamTrainingSummarizeActivity,
  postExamTrainingTeachActivity,
} from "./post-exam-training-activities.js";
