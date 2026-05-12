import { afterEach, describe, expect, it, vi } from "vitest";
import { embedText } from "./embeddings.js";

const originalOpenAiBaseUrl = process.env["OPENAI_BASE_URL"];
const originalOpenAiApiKey = process.env["OPENAI_API_KEY"];

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalOpenAiBaseUrl === undefined) {
    delete process.env["OPENAI_BASE_URL"];
  } else {
    process.env["OPENAI_BASE_URL"] = originalOpenAiBaseUrl;
  }
  if (originalOpenAiApiKey === undefined) {
    delete process.env["OPENAI_API_KEY"];
  } else {
    process.env["OPENAI_API_KEY"] = originalOpenAiApiKey;
  }
});

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

  it("rejects provider responses with invalid embedding dimensions", async () => {
    process.env["OPENAI_BASE_URL"] = "http://127.0.0.1:11434/v1";
    delete process.env["OPENAI_API_KEY"];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [{ embedding: [0.1, 0.2] }],
            usage: { prompt_tokens: 3 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(
      embedText({
        text: "candidate",
        provider: "openai",
        model: "embedding-model",
        expectedDimension: 3,
        context: "questionEmbedding",
      }),
    ).rejects.toThrow("questionEmbedding: expected 3 dimensions, got 2");
  });
});
