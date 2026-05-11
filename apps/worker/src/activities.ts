import { and, eq } from "drizzle-orm";
import type { DbClient } from "@prepify/db";
import {
  createDb,
  domains,
  examTypes,
  generationJobs,
  llmUsageEvents,
  questionOptions,
  questions,
} from "@prepify/db";
import { validateGeneratedQuestionPayload } from "@prepify/shared";

import { runQuestionGenerationModel } from "./question-generation.js";

let _db: DbClient | undefined;

function getDb() {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is required for worker activities");
  _db ??= createDb(url);
  return _db;
}

async function recordUsage(params: {
  jobId: string;
  environmentLabel: string;
  provider: string;
  model: string;
  role: string;
  workflowId: string;
  activityName: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const total = params.inputTokens + params.outputTokens;
  await getDb().insert(llmUsageEvents).values({
    environmentLabel: params.environmentLabel,
    provider: params.provider,
    model: params.model,
    role: params.role,
    workflowId: params.workflowId,
    jobId: params.jobId,
    activityName: params.activityName,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    totalTokens: total,
  });
}

async function failJob(jobId: string, message: string): Promise<void> {
  await getDb()
    .update(generationJobs)
    .set({
      status: "failed",
      errorMessage: message.slice(0, 4000),
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobId));
}

function roleConfig(role: "summarization" | "question_generation") {
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

export async function summarizeTopic(input: {
  jobId: string;
  topic: string;
  environmentLabel: string;
  workflowId: string;
}): Promise<string> {
  const cfg = roleConfig("summarization");
  await getDb()
    .update(generationJobs)
    .set({ status: "running", updatedAt: new Date() })
    .where(eq(generationJobs.id, input.jobId));

  await recordUsage({
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

  return `Summary for "${input.topic}" (mock summarization).`;
}

export async function generateQuestionItem(input: {
  jobId: string;
  topic: string;
  environmentLabel: string;
  summary: string;
  workflowId: string;
}): Promise<{ ok: true; questionId: string }> {
  const cfg = roleConfig("question_generation");

  try {
    const { raw, inputTokens, outputTokens } = await runQuestionGenerationModel({
      topic: input.topic,
      summary: input.summary,
      provider: cfg.provider,
      model: cfg.model,
    });

    await recordUsage({
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

    const parsed = validateGeneratedQuestionPayload(raw);
    if (!parsed.ok) {
      throw new Error(`Generation validation failed: ${parsed.errors.join("; ")}`);
    }

    const db = getDb();
    const exam = (await db.select().from(examTypes).where(eq(examTypes.code, "SAA-C03")))[0];
    if (!exam) {
      throw new Error("SAA-C03 exam type missing — run migrations and seed.");
    }

    const domain = (
      await db
        .select()
        .from(domains)
        .where(and(eq(domains.examTypeId, exam.id), eq(domains.code, parsed.value.domainCode)))
    )[0];
    if (!domain) {
      throw new Error(`Domain ${parsed.value.domainCode} not found`);
    }

    const sortedOpts = [...parsed.value.options].sort((a, b) => a.position - b.position);

    const [qRow] = await db
      .insert(questions)
      .values({
        examTypeId: exam.id,
        domainId: domain.id,
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

    await db
      .update(generationJobs)
      .set({ status: "succeeded", updatedAt: new Date(), errorMessage: null })
      .where(eq(generationJobs.id, input.jobId));

    return { ok: true, questionId: qRow!.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await failJob(input.jobId, msg);
    throw e;
  }
}
