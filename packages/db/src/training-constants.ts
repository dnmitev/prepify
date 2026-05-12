/** Must match `vector(N)` in migration `post_exam_training_embedding_chunks.embedding`. */
export const POST_EXAM_TRAINING_EMBEDDING_DIMENSION = 384 as const;

/** Must match `vector(N)` in migration `question_embeddings.embedding`. */
export const QUESTION_EMBEDDING_DIMENSION = 384 as const;

export function assertEmbeddingDimension(vec: readonly number[], context = "embedding"): void {
  if (vec.length !== POST_EXAM_TRAINING_EMBEDDING_DIMENSION) {
    throw new Error(
      `${context}: expected ${String(POST_EXAM_TRAINING_EMBEDDING_DIMENSION)} dimensions, got ${String(vec.length)}`,
    );
  }
}

export function assertQuestionEmbeddingDimension(
  vec: readonly number[],
  context = "questionEmbedding",
): void {
  if (vec.length !== QUESTION_EMBEDDING_DIMENSION) {
    throw new Error(
      `${context}: expected ${String(QUESTION_EMBEDDING_DIMENSION)} dimensions, got ${String(vec.length)}`,
    );
  }
}
