import { ApplicationFailure } from "@temporalio/activity";
import { eq } from "drizzle-orm";
import {
  deletePostExamEmbeddingChunksForRun,
  getPostExamTrainingRunByAttemptId,
  insertPostExamEmbeddingChunks,
  insertPostExamTrainingRun,
  listPostExamItemSummaries,
  loadPostExamTrainingContext,
  postExamTrainingRuns,
  replacePostExamItemSummaries,
  touchPostExamTrainingWorkflowId,
  updatePostExamTrainingRunStatus,
  type IncorrectScoredItemPayload,
} from "@prepify/db";
import { validatePostExamTeachingText } from "@prepify/shared";

import { workerDb } from "./db-client.js";
import { recordLlmUsage } from "./llm-usage.js";
import { embedTextForTraining } from "./post-exam-training-embeddings.js";
import {
  chunkTeachingTextForEmbedding,
  runFailureSummarizationModel,
  runPostExamTeachingModel,
} from "./post-exam-training-llm.js";

function roleConfig(kind: "failure_summarization" | "post_exam_teaching" | "embedding"): {
  provider: string;
  model: string;
} {
  if (kind === "failure_summarization") {
    return {
      provider: process.env["LLM_ROLE_FAILURE_SUMMARIZATION_PROVIDER"] ?? "mock",
      model: process.env["LLM_ROLE_FAILURE_SUMMARIZATION_MODEL"] ?? "mock-mini",
    };
  }
  if (kind === "post_exam_teaching") {
    return {
      provider: process.env["LLM_ROLE_POST_EXAM_TEACHING_PROVIDER"] ?? "mock",
      model: process.env["LLM_ROLE_POST_EXAM_TEACHING_MODEL"] ?? "mock-large",
    };
  }
  return {
    provider: process.env["LLM_ROLE_EMBEDDING_PROVIDER"] ?? "mock",
    model: process.env["LLM_ROLE_EMBEDDING_MODEL"] ?? "bge-small-en-v1.5",
  };
}

export async function postExamTrainingPrepareActivity(input: {
  attemptId: string;
  examTypeCode: string;
  environmentLabel: string;
  temporalWorkflowId: string;
}): Promise<{ skip: true } | { skip: false; runId: string; items: IncorrectScoredItemPayload[] }> {
  const db = workerDb();
  const ctx = await loadPostExamTrainingContext(db, input.attemptId);
  if (!ctx || ctx.incorrectItems.length === 0) {
    throw ApplicationFailure.nonRetryable("No incorrect scored items for post-exam training");
  }
  if (ctx.examTypeCode !== input.examTypeCode) {
    throw ApplicationFailure.nonRetryable("examTypeCode mismatch for post-exam training workflow");
  }

  let run = await getPostExamTrainingRunByAttemptId(db, input.attemptId);
  if (run?.status === "succeeded") {
    return { skip: true };
  }

  if (!run) {
    const inserted = await insertPostExamTrainingRun(db, {
      attemptId: input.attemptId,
      examTypeCode: input.examTypeCode,
      temporalWorkflowId: input.temporalWorkflowId,
      environmentLabel: input.environmentLabel,
    });
    run = inserted ?? (await getPostExamTrainingRunByAttemptId(db, input.attemptId));
  } else {
    await touchPostExamTrainingWorkflowId(db, input.attemptId, input.temporalWorkflowId);
  }

  if (!run) {
    throw ApplicationFailure.nonRetryable("Could not create post-exam training run row");
  }

  if (run.status === "failed") {
    await updatePostExamTrainingRunStatus(db, run.id, {
      status: "pending",
      errorMessage: null,
      teachingText: null,
    });
  }

  await updatePostExamTrainingRunStatus(db, run.id, { status: "summarizing" });

  return { skip: false, runId: run.id, items: ctx.incorrectItems };
}

export async function postExamTrainingSummarizeActivity(input: {
  runId: string;
  attemptId: string;
  examTypeCode: string;
  items: IncorrectScoredItemPayload[];
  environmentLabel: string;
  workflowId: string;
}): Promise<void> {
  const db = workerDb();
  const cfg = roleConfig("failure_summarization");
  const rows: { questionId: string; summaryText: string }[] = [];

  for (const item of input.items) {
    const { text, inputTokens, outputTokens } = await runFailureSummarizationModel({
      item,
      examTypeCode: input.examTypeCode,
      provider: cfg.provider,
      model: cfg.model,
    });
    await recordLlmUsage(db, {
      environmentLabel: input.environmentLabel,
      provider: cfg.provider,
      model: cfg.model,
      role: "failure_summarization",
      workflowId: input.workflowId,
      activityName: "postExamTrainingSummarizeActivity",
      inputTokens,
      outputTokens,
    });
    rows.push({ questionId: item.questionId, summaryText: text });
  }

  await replacePostExamItemSummaries(db, input.runId, rows);
  await updatePostExamTrainingRunStatus(db, input.runId, { status: "teaching" });
}

export async function postExamTrainingTeachActivity(input: {
  runId: string;
  examTypeCode: string;
  environmentLabel: string;
  workflowId: string;
}): Promise<void> {
  const db = workerDb();
  const summaries = await listPostExamItemSummaries(db, input.runId);
  if (summaries.length === 0) {
    throw ApplicationFailure.nonRetryable("Missing item summaries for teaching step");
  }

  const cfg = roleConfig("post_exam_teaching");
  const { text, inputTokens, outputTokens } = await runPostExamTeachingModel({
    examTypeCode: input.examTypeCode,
    summaries: summaries.map((s) => ({ questionId: s.questionId, text: s.summaryText })),
    provider: cfg.provider,
    model: cfg.model,
  });

  await recordLlmUsage(db, {
    environmentLabel: input.environmentLabel,
    provider: cfg.provider,
    model: cfg.model,
    role: "post_exam_teaching",
    workflowId: input.workflowId,
    activityName: "postExamTrainingTeachActivity",
    inputTokens,
    outputTokens,
  });

  const validated = validatePostExamTeachingText(text);
  if (!validated.ok) {
    await updatePostExamTrainingRunStatus(db, input.runId, {
      status: "failed",
      errorMessage: validated.errors.join("; "),
    });
    throw ApplicationFailure.nonRetryable(`Teaching validation failed: ${validated.errors.join("; ")}`);
  }

  await updatePostExamTrainingRunStatus(db, input.runId, {
    status: "embedding",
    teachingText: validated.value,
    errorMessage: null,
  });
}

export async function postExamTrainingEmbedActivity(input: {
  runId: string;
  environmentLabel: string;
  workflowId: string;
}): Promise<void> {
  const db = workerDb();
  try {
    const [row] = await db.select().from(postExamTrainingRuns).where(eq(postExamTrainingRuns.id, input.runId));
    if (!row?.teachingText) {
      throw ApplicationFailure.nonRetryable("Missing teaching text before embedding");
    }

    const embedCfg = roleConfig("embedding");
    const chunks = chunkTeachingTextForEmbedding(row.teachingText);
    if (chunks.length === 0) {
      await updatePostExamTrainingRunStatus(db, input.runId, {
        status: "failed",
        errorMessage: "No embeddable chunks from teaching text",
      });
      throw ApplicationFailure.nonRetryable("No embeddable chunks");
    }

    await deletePostExamEmbeddingChunksForRun(db, input.runId);

    const embedRows: {
      runId: string;
      chunkIndex: number;
      contentText: string;
      embedding: number[];
      embeddingModel: string;
    }[] = [];

    let totalIn = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      const { embedding, inputTokens } = await embedTextForTraining({
        text: chunk,
        provider: embedCfg.provider,
        model: embedCfg.model,
      });
      totalIn += inputTokens;
      embedRows.push({
        runId: input.runId,
        chunkIndex: i,
        contentText: chunk,
        embedding,
        embeddingModel: embedCfg.model,
      });
    }

    await recordLlmUsage(db, {
      environmentLabel: input.environmentLabel,
      provider: embedCfg.provider,
      model: embedCfg.model,
      role: "embedding",
      workflowId: input.workflowId,
      activityName: "postExamTrainingEmbedActivity",
      inputTokens: totalIn,
      outputTokens: 0,
    });

    await insertPostExamEmbeddingChunks(db, embedRows);
    await updatePostExamTrainingRunStatus(db, input.runId, {
      status: "succeeded",
      embeddingModel: embedCfg.model,
      embeddingDim: embedRows[0]?.embedding.length ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await updatePostExamTrainingRunStatus(db, input.runId, {
      status: "failed",
      errorMessage: msg.slice(0, 4000),
    });
    throw e;
  }
}
