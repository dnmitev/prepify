import { describe, expect, it } from "vitest";
import {
  decideQuestionDuplicate,
  maxQuestionGenerationCandidateAttempts,
  questionDuplicateThresholdConfigFromEnv,
} from "./question-dedupe.js";

describe("question duplicate threshold config", () => {
  it("uses defaults for missing or invalid env values", () => {
    expect(
      questionDuplicateThresholdConfigFromEnv({
        QUESTION_DUPLICATE_HARD_THRESHOLD: "not-a-number",
        QUESTION_DUPLICATE_REVIEW_THRESHOLD: "3",
        QUESTION_GENERATION_MAX_ATTEMPT_MULTIPLIER: "0",
      }),
    ).toEqual({
      hardThreshold: 0.94,
      reviewThreshold: 0.88,
      maxAttemptMultiplier: 3,
    });
  });

  it("bounds review threshold to hard threshold", () => {
    expect(
      questionDuplicateThresholdConfigFromEnv({
        QUESTION_DUPLICATE_HARD_THRESHOLD: "0.91",
        QUESTION_DUPLICATE_REVIEW_THRESHOLD: "0.95",
        QUESTION_GENERATION_MAX_ATTEMPT_MULTIPLIER: "4",
      }),
    ).toEqual({
      hardThreshold: 0.91,
      reviewThreshold: 0.91,
      maxAttemptMultiplier: 4,
    });
  });
});

describe("decideQuestionDuplicate", () => {
  it("classifies hard duplicate, review-band, and distinct candidates", () => {
    expect(
      decideQuestionDuplicate({
        similarity: 0.95,
        hardThreshold: 0.94,
        reviewThreshold: 0.88,
      }).kind,
    ).toBe("hard_duplicate");

    expect(
      decideQuestionDuplicate({
        similarity: 0.9,
        hardThreshold: 0.94,
        reviewThreshold: 0.88,
      }).kind,
    ).toBe("review");

    expect(
      decideQuestionDuplicate({
        similarity: 0.87,
        hardThreshold: 0.94,
        reviewThreshold: 0.88,
      }).kind,
    ).toBe("distinct");
  });
});

describe("maxQuestionGenerationCandidateAttempts", () => {
  it("derives a bounded candidate attempt count from target and multiplier", () => {
    expect(maxQuestionGenerationCandidateAttempts({ targetQuestionCount: 5, maxAttemptMultiplier: 3 })).toBe(15);
    expect(maxQuestionGenerationCandidateAttempts({ targetQuestionCount: 0, maxAttemptMultiplier: 0 })).toBe(1);
  });
});
