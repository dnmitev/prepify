export type QuestionFormat = "single" | "multiple";

export type QuestionValidationInput = {
  format: QuestionFormat;
  options: { position: number; isCorrect: boolean }[];
};

export function validateQuestionStructure(input: QuestionValidationInput): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (input.options.length < 2) {
    errors.push("At least two options are required.");
  }
  const correctCount = input.options.filter((o) => o.isCorrect).length;
  if (correctCount < 1) {
    errors.push("At least one correct option is required.");
  }
  if (input.format === "single") {
    if (correctCount !== 1) {
      errors.push("Single-select must have exactly one correct option.");
    }
  } else {
    if (correctCount < 2) {
      errors.push("Multi-select must have two or more correct options.");
    }
  }
  return { ok: errors.length === 0, errors };
}
