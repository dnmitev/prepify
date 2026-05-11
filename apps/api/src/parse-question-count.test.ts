import { describe, expect, it } from "vitest";
import { maxQuestionsPerJobFromEnv, parseQuestionCount } from "./parse-question-count.js";

describe("parseQuestionCount", () => {
  it("defaults to 1 when omitted", () => {
    expect(parseQuestionCount(undefined, 50)).toEqual({ ok: true, value: 1 });
    expect(parseQuestionCount(null, 50)).toEqual({ ok: true, value: 1 });
  });

  it("accepts in-range integers", () => {
    expect(parseQuestionCount(3, 50)).toEqual({ ok: true, value: 3 });
    expect(parseQuestionCount(50, 50)).toEqual({ ok: true, value: 50 });
  });

  it("rejects out of range or non-integers", () => {
    expect(parseQuestionCount(0, 50).ok).toBe(false);
    expect(parseQuestionCount(51, 50).ok).toBe(false);
    expect(parseQuestionCount(1.5, 50).ok).toBe(false);
    expect(parseQuestionCount("3" as unknown as number, 50).ok).toBe(false);
  });
});

describe("maxQuestionsPerJobFromEnv", () => {
  it("falls back when unset or invalid", () => {
    expect(maxQuestionsPerJobFromEnv(() => undefined)).toBe(50);
    expect(maxQuestionsPerJobFromEnv(() => "0")).toBe(50);
    expect(maxQuestionsPerJobFromEnv(() => "nope")).toBe(50);
  });

  it("parses positive integers", () => {
    expect(maxQuestionsPerJobFromEnv(() => "10")).toBe(10);
  });
});
