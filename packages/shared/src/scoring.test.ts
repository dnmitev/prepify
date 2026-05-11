import { describe, expect, it } from "vitest";
import { passesExam, scaledScoreFromAccuracy } from "./scoring.js";

describe("scoring", () => {
  it("maps 0 and 1 endpoints", () => {
    expect(scaledScoreFromAccuracy(0)).toBe(100);
    expect(scaledScoreFromAccuracy(1)).toBe(1000);
  });

  it("passes at threshold", () => {
    expect(passesExam(720, 720)).toBe(true);
    expect(passesExam(719, 720)).toBe(false);
  });
});
