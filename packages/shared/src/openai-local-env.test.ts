import { describe, expect, it } from "vitest";
import { allowsMissingOpenAiApiKey } from "./openai-local-env.js";

/** Deterministic empty env for unit tests (avoid inheriting developer OPENAI_* vars). */
const emptyEnv = {} as NodeJS.ProcessEnv;

describe("allowsMissingOpenAiApiKey", () => {
  it("requires a key for api.openai.com by default", () => {
    expect(allowsMissingOpenAiApiKey("https://api.openai.com/v1", emptyEnv)).toBe(false);
  });

  it("allows missing key for localhost OpenAI-compatible URLs", () => {
    expect(allowsMissingOpenAiApiKey("http://localhost:11434/v1", emptyEnv)).toBe(true);
    expect(allowsMissingOpenAiApiKey("http://127.0.0.1:11434/v1", emptyEnv)).toBe(true);
  });

  it("allows missing key when LOCAL_LLM_SKIP_API_KEY=1", () => {
    expect(
      allowsMissingOpenAiApiKey("https://api.example.com/v1", {
        LOCAL_LLM_SKIP_API_KEY: "1",
      } as NodeJS.ProcessEnv),
    ).toBe(true);
  });
});
