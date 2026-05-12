import type { DbClient } from "./db-types.js";
import { getPgPool } from "./pg-pool-access.js";
import { assertQuestionEmbeddingDimension } from "./training-constants.js";

export type QuestionEmbeddingHit = {
  questionId: string;
  canonicalTextHash: string;
  embeddingModel: string;
  distance: number;
  similarity: number;
};

export function vectorLiteral(vec: readonly number[]): string {
  return `[${vec.map((n) => Number(n.toFixed(8))).join(",")}]`;
}

export function similarityToBasisPoints(similarity: number): number {
  const bounded = Math.min(Math.max(similarity, 0), 1);
  return Math.round(bounded * 10000);
}

export async function insertQuestionEmbedding(
  db: DbClient,
  params: {
    questionId: string;
    examTypeId: string;
    domainId: string;
    canonicalTextHash: string;
    embedding: number[];
    embeddingModel: string;
  },
): Promise<void> {
  assertQuestionEmbeddingDimension(params.embedding);
  const pool = getPgPool(db);
  await pool.query(
    `INSERT INTO question_embeddings (
       question_id,
       exam_type_id,
       domain_id,
       canonical_text_hash,
       embedding,
       embedding_model,
       embedding_dim
     )
     VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5::vector, $6, $7)
     ON CONFLICT (question_id) DO UPDATE SET
       exam_type_id = EXCLUDED.exam_type_id,
       domain_id = EXCLUDED.domain_id,
       canonical_text_hash = EXCLUDED.canonical_text_hash,
       embedding = EXCLUDED.embedding,
       embedding_model = EXCLUDED.embedding_model,
       embedding_dim = EXCLUDED.embedding_dim,
       updated_at = now()`,
    [
      params.questionId,
      params.examTypeId,
      params.domainId,
      params.canonicalTextHash,
      vectorLiteral(params.embedding),
      params.embeddingModel,
      params.embedding.length,
    ],
  );
}

/**
 * Cosine distance via pgvector `<=>` (lower is closer for cosine distance in pgvector).
 * Similarity is derived as `1 - distance`.
 */
export async function searchQuestionEmbeddingNeighbors(
  db: DbClient,
  params: {
    examTypeId: string;
    domainId: string;
    embedding: number[];
    limit: number;
    excludeQuestionId?: string | null;
  },
): Promise<QuestionEmbeddingHit[]> {
  assertQuestionEmbeddingDimension(params.embedding, "queryEmbedding");
  const pool = getPgPool(db);
  const limit = Math.min(Math.max(1, params.limit), 50);
  const res = await pool.query<{
    question_id: string;
    canonical_text_hash: string;
    embedding_model: string;
    distance: string;
  }>(
    `SELECT question_id, canonical_text_hash, embedding_model, embedding <=> $1::vector AS distance
     FROM question_embeddings
     WHERE exam_type_id = $2::uuid
       AND domain_id = $3::uuid
       AND ($4::uuid IS NULL OR question_id <> $4::uuid)
     ORDER BY embedding <=> $1::vector
     LIMIT $5`,
    [
      vectorLiteral(params.embedding),
      params.examTypeId,
      params.domainId,
      params.excludeQuestionId ?? null,
      limit,
    ],
  );

  return res.rows.map((r) => {
    const distance = Number.parseFloat(r.distance);
    return {
      questionId: r.question_id,
      canonicalTextHash: r.canonical_text_hash,
      embeddingModel: r.embedding_model,
      distance,
      similarity: 1 - distance,
    };
  });
}

export async function recordQuestionGenerationCandidateAttempt(
  db: DbClient,
  params: { jobId: string; candidateAttemptNumber: number },
): Promise<void> {
  const pool = getPgPool(db);
  await pool.query(
    `UPDATE generation_jobs
     SET candidate_attempt_count = GREATEST(candidate_attempt_count, $2),
         updated_at = now()
     WHERE id = $1::uuid`,
    [params.jobId, params.candidateAttemptNumber],
  );
}

export async function recordSkippedDuplicateQuestionCandidate(
  db: DbClient,
  params: {
    jobId: string;
    candidateAttemptNumber: number;
    nearestQuestionId: string | null;
    similarity: number;
    threshold: number;
    canonicalTextHash: string;
  },
): Promise<void> {
  const pool = getPgPool(db);
  await pool.query(
    `INSERT INTO generation_job_duplicate_candidates (
       generation_job_id,
       candidate_attempt_number,
       nearest_question_id,
       similarity_score_bps,
       threshold_bps,
       canonical_text_hash
     )
     VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6)
     ON CONFLICT (generation_job_id, candidate_attempt_number) DO UPDATE SET
       nearest_question_id = EXCLUDED.nearest_question_id,
       similarity_score_bps = EXCLUDED.similarity_score_bps,
       threshold_bps = EXCLUDED.threshold_bps,
       canonical_text_hash = EXCLUDED.canonical_text_hash`,
    [
      params.jobId,
      params.candidateAttemptNumber,
      params.nearestQuestionId,
      similarityToBasisPoints(params.similarity),
      similarityToBasisPoints(params.threshold),
      params.canonicalTextHash,
    ],
  );
  await pool.query(
    `UPDATE generation_jobs
     SET candidate_attempt_count = GREATEST(candidate_attempt_count, $2),
         duplicate_skipped_count = (
           SELECT count(*)::integer
           FROM generation_job_duplicate_candidates
           WHERE generation_job_id = $1::uuid
         ),
         updated_at = now()
     WHERE id = $1::uuid`,
    [params.jobId, params.candidateAttemptNumber],
  );
}
