import { describe, expect, it } from "vitest";
import { validateQuestionStructure } from "./question-validation.js";

describe("validateQuestionStructure", () => {
  it("accepts valid single-select", () => {
    const r = validateQuestionStructure({
      format: "single",
      options: [
        { position: 0, isCorrect: true },
        { position: 1, isCorrect: false },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it("rejects multi with one correct", () => {
    const r = validateQuestionStructure({
      format: "multiple",
      options: [
        { position: 0, isCorrect: true },
        { position: 1, isCorrect: false },
      ],
    });
    expect(r.ok).toBe(false);
  });
});
