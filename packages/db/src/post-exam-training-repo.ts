import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { DbClient } from "./db-types.js";
import { getPgPool } from "./pg-pool-access.js";
import { postExamTrainingItemSummaries, postExamTrainingRuns } from "./schema.js";
import { assertEmbeddingDimension } from "./training-constants.js";

export type PostExamTrainingRunRow = typeof postExamTrainingRuns.$inferSelect;

export async function getPostExamTrainingRunByAttemptId(
  db: DbClient,
  attemptId: string,
): Promise<PostExamTrainingRunRow | undefined> {
  const [row] = await db
    .select()
    .from(postExamTrainingRuns)
    .where(eq(postExamTrainingRuns.attemptId, attemptId));
  return row;
}

export async function insertPostExamTrainingRun(
  db: DbClient,
  params: {
    attemptId: string;
    examTypeCode: string;
    temporalWorkflowId: string;
    environmentLabel: string;
    userId?: string | null;
  },
): Promise<PostExamTrainingRunRow | undefined> {
  const [row] = await db
    .insert(postExamTrainingRuns)
    .values({
      attemptId: params.attemptId,
      examTypeCode: params.examTypeCode,
      status: "pending",
      temporalWorkflowId: params.temporalWorkflowId,
      environmentLabel: params.environmentLabel,
      userId: params.userId ?? null,
    })
    .onConflictDoNothing({ target: postExamTrainingRuns.attemptId })
    .returning();
  return row;
}

export async function touchPostExamTrainingWorkflowId(
  db: DbClient,
  attemptId: string,
  temporalWorkflowId: string,
): Promise<void> {
  await db
    .update(postExamTrainingRuns)
    .set({ temporalWorkflowId, updatedAt: new Date() })
    .where(eq(postExamTrainingRuns.attemptId, attemptId));
}

export async function updatePostExamTrainingRunStatus(
  db: DbClient,
  runId: string,
  params: {
    status: string;
    teachingText?: string | null;
    errorMessage?: string | null;
    embeddingModel?: string | null;
    embeddingDim?: number | null;
  },
): Promise<void> {
  await db
    .update(postExamTrainingRuns)
    .set({
      status: params.status,
      teachingText: params.teachingText,
      errorMessage: params.errorMessage,
      embeddingModel: params.embeddingModel ?? undefined,
      embeddingDim: params.embeddingDim ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(postExamTrainingRuns.id, runId));
}

export async function replacePostExamItemSummaries(
  db: DbClient,
  runId: string,
  rows: { questionId: string; summaryText: string }[],
): Promise<void> {
  await db.delete(postExamTrainingItemSummaries).where(eq(postExamTrainingItemSummaries.runId, runId));
  if (rows.length === 0) return;
  await db.insert(postExamTrainingItemSummaries).values(
    rows.map((r) => ({
      runId,
      questionId: r.questionId,
      summaryText: r.summaryText,
    })),
  );
}

export async function listPostExamItemSummaries(
  db: DbClient,
  runId: string,
): Promise<(typeof postExamTrainingItemSummaries.$inferSelect)[]> {
  return db
    .select()
    .from(postExamTrainingItemSummaries)
    .where(eq(postExamTrainingItemSummaries.runId, runId));
}

export async function insertPostExamEmbeddingChunks(
  db: DbClient,
  rows: Array<{
    runId: string;
    chunkIndex: number;
    contentText: string;
    embedding: number[];
    embeddingModel: string;
  }>,
): Promise<void> {
  const pool = getPgPool(db);
  for (const r of rows) {
    assertEmbeddingDimension(r.embedding);
    const id = randomUUID();
    const vecLiteral = `[${r.embedding.map((n) => Number(n.toFixed(8))).join(",")}]`;
    await pool.query(
      `INSERT INTO post_exam_training_embedding_chunks (id, run_id, chunk_index, content_text, embedding, embedding_model)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5::vector, $6)
       ON CONFLICT (run_id, chunk_index) DO UPDATE SET
         content_text = EXCLUDED.content_text,
         embedding = EXCLUDED.embedding,
         embedding_model = EXCLUDED.embedding_model`,
      [id, r.runId, r.chunkIndex, r.contentText, vecLiteral, r.embeddingModel],
    );
  }
}

export async function deletePostExamEmbeddingChunksForRun(db: DbClient, runId: string): Promise<void> {
  const pool = getPgPool(db);
  await pool.query(`DELETE FROM post_exam_training_embedding_chunks WHERE run_id = $1::uuid`, [runId]);
}

export type TrainingMemoryHit = {
  runId: string;
  chunkIndex: number;
  contentText: string;
  distance: number;
};

/**
 * Cosine distance via pgvector `<=>` (lower is closer for cosine distance in pgvector).
 */
export async function searchPostExamTrainingMemory(
  db: DbClient,
  queryEmbedding: number[],
  k: number,
): Promise<TrainingMemoryHit[]> {
  assertEmbeddingDimension(queryEmbedding, "queryEmbedding");
  const pool = getPgPool(db);
  const vecLiteral = `[${queryEmbedding.map((n) => Number(n.toFixed(8))).join(",")}]`;
  const limit = Math.min(Math.max(1, k), 50);
  const res = await pool.query<{
    run_id: string;
    chunk_index: number;
    content_text: string;
    distance: string;
  }>(
    `SELECT run_id, chunk_index, content_text, embedding <=> $1::vector AS distance
     FROM post_exam_training_embedding_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vecLiteral, limit],
  );
  return res.rows.map((r) => ({
    runId: r.run_id,
    chunkIndex: r.chunk_index,
    contentText: r.content_text,
    distance: Number.parseFloat(r.distance),
  }));
}

/** Latest runs (debug / API). */
export async function listRecentPostExamTrainingRuns(
  db: DbClient,
  limit: number,
): Promise<PostExamTrainingRunRow[]> {
  const n = Math.min(Math.max(1, limit), 50);
  return db
    .select()
    .from(postExamTrainingRuns)
    .orderBy(desc(postExamTrainingRuns.createdAt))
    .limit(n);
}
