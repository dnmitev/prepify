import { describe, expect, it } from "vitest";
import { similarityToBasisPoints, vectorLiteral } from "./question-embedding-repo.js";

describe("question embedding repository helpers", () => {
  it("formats pgvector literals with bounded precision", () => {
    expect(vectorLiteral([0.123456789, -0.5, 1])).toBe("[0.12345679,-0.5,1]");
  });

  it("converts similarity to bounded basis points", () => {
    expect(similarityToBasisPoints(0.94321)).toBe(9432);
    expect(similarityToBasisPoints(-0.2)).toBe(0);
    expect(similarityToBasisPoints(1.2)).toBe(10000);
  });
});
