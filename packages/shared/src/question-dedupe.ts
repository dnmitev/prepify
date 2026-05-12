export const DEFAULT_QUESTION_DUPLICATE_HARD_THRESHOLD = 0.94;
export const DEFAULT_QUESTION_DUPLICATE_REVIEW_THRESHOLD = 0.88;
export const DEFAULT_QUESTION_GENERATION_MAX_ATTEMPT_MULTIPLIER = 3;

export type QuestionDuplicateDecisionKind = "hard_duplicate" | "review" | "distinct";

export type QuestionDuplicateThresholdConfig = {
  hardThreshold: number;
  reviewThreshold: number;
  maxAttemptMultiplier: number;
};

export type QuestionDuplicateDecision = {
  kind: QuestionDuplicateDecisionKind;
  similarity: number;
  hardThreshold: number;
  reviewThreshold: number;
};

function parseUnitInterval(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return fallback;
  return parsed;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function questionDuplicateThresholdConfigFromEnv(
  env: Record<string, string | undefined>,
): QuestionDuplicateThresholdConfig {
  const hardThreshold = parseUnitInterval(
    env["QUESTION_DUPLICATE_HARD_THRESHOLD"],
    DEFAULT_QUESTION_DUPLICATE_HARD_THRESHOLD,
  );
  const requestedReviewThreshold = parseUnitInterval(
    env["QUESTION_DUPLICATE_REVIEW_THRESHOLD"],
    DEFAULT_QUESTION_DUPLICATE_REVIEW_THRESHOLD,
  );
  const reviewThreshold = Math.min(requestedReviewThreshold, hardThreshold);
  const maxAttemptMultiplier = parsePositiveInteger(
    env["QUESTION_GENERATION_MAX_ATTEMPT_MULTIPLIER"],
    DEFAULT_QUESTION_GENERATION_MAX_ATTEMPT_MULTIPLIER,
  );
  return { hardThreshold, reviewThreshold, maxAttemptMultiplier };
}

export function decideQuestionDuplicate(params: {
  similarity: number;
  hardThreshold: number;
  reviewThreshold: number;
}): QuestionDuplicateDecision {
  const similarity = Math.min(Math.max(params.similarity, 0), 1);
  const hardThreshold = Math.min(Math.max(params.hardThreshold, 0), 1);
  const reviewThreshold = Math.min(Math.max(params.reviewThreshold, 0), hardThreshold);
  const kind =
    similarity >= hardThreshold ? "hard_duplicate"
    : similarity >= reviewThreshold ? "review"
    : "distinct";
  return { kind, similarity, hardThreshold, reviewThreshold };
}

export function maxQuestionGenerationCandidateAttempts(params: {
  targetQuestionCount: number;
  maxAttemptMultiplier: number;
}): number {
  const target = Math.max(1, Math.floor(params.targetQuestionCount));
  const multiplier = Math.max(1, Math.floor(params.maxAttemptMultiplier));
  return target * multiplier;
}
