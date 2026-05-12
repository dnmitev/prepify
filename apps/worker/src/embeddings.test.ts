import { describe, expect, it } from "vitest";
import { embedText } from "./embeddings.js";

describe("embedText", () => {
  it("returns deterministic normalized mock embeddings at requested dimension", async () => {
    const first = await embedText({
      text: "same text",
      provider: "mock",
      model: "mock-embedding",
      expectedDimension: 8,
    });
    const second = await embedText({
      text: "same text",
      provider: "mock",
      model: "mock-embedding",
      expectedDimension: 8,
    });

    expect(first.embedding).toHaveLength(8);
    expect(first.embedding).toEqual(second.embedding);
    expect(first.inputTokens).toBe(4);
    const norm = Math.sqrt(first.embedding.reduce((s, v) => s + v * v, 0));
    expect(norm).toBeCloseTo(1, 8);
  });
});
