import {
  assertEmbeddingDimension,
  POST_EXAM_TRAINING_EMBEDDING_DIMENSION,
} from "@prepify/db";
import { embedText } from "./embeddings.js";

/**
 * English-only content is assumed by the post-exam training pipeline.
 */
export async function embedTextForTraining(params: {
  text: string;
  provider: string;
  model: string;
}): Promise<{ embedding: number[]; inputTokens: number }> {
  const { embedding, inputTokens } = await embedText({
    text: params.text,
    provider: params.provider,
    model: params.model,
    expectedDimension: POST_EXAM_TRAINING_EMBEDDING_DIMENSION,
    context: "trainingEmbedding",
  });
  assertEmbeddingDimension(embedding);
  return { embedding, inputTokens };
}
