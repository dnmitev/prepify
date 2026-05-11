import { describe, expect, it } from "vitest";
import { chunkTeachingTextForEmbedding } from "./post-exam-training-llm.js";

describe("chunkTeachingTextForEmbedding", () => {
  it("splits long combined paragraphs", () => {
    const a = "x".repeat(800);
    const b = "y".repeat(800);
    const chunks = chunkTeachingTextForEmbedding(`${a}\n\n${b}`, 900);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.every((c) => c.length <= 900 + 50)).toBe(true);
  });
});
