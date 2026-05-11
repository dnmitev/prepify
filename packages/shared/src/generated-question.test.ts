import { describe, expect, it } from "vitest";
import { validateGeneratedQuestionPayload } from "./generated-question.js";

function minimalValidPayload(domainCode: string) {
  return {
    stem:
      "A company runs an API behind Amazon API Gateway and wants to throttle abusive clients per API key without maintaining server-side sessions. What should the architect do?",
    format: "single" as const,
    domainCode,
    options: [
      {
        position: 0,
        text: "Use a Lambda authorizer only.",
        isCorrect: false,
        explanation: "Authorizers authenticate; they do not provide built-in per-key throttling.",
      },
      {
        position: 1,
        text: "Enable usage plans and API keys on API Gateway with throttling limits.",
        isCorrect: true,
        explanation:
          "Usage plans tie API keys to per-stage throttling and quota limits, matching per-client rate control at the edge.",
      },
      {
        position: 2,
        text: "Move throttling to ALB listener rules.",
        isCorrect: false,
        explanation: "ALB can throttle broadly but not as cleanly per API key as API Gateway usage plans.",
      },
      {
        position: 3,
        text: "Disable API caching.",
        isCorrect: false,
        explanation: "Caching affects latency and cost, not abusive traffic shaping per key.",
      },
    ],
  };
}

describe("validateGeneratedQuestionPayload", () => {
  it("accepts a well-formed single-select item with reasoning on the correct option", () => {
    const r = validateGeneratedQuestionPayload(minimalValidPayload("SECURE"));
    expect(r.ok).toBe(true);
  });

  it("infers single-select when format says multiple but only one answer is marked correct", () => {
    const base = minimalValidPayload("SECURE");
    const r = validateGeneratedQuestionPayload({
      ...base,
      format: "multiple",
      options: base.options.map((o, i) => ({
        ...o,
        isCorrect: i === 1,
      })),
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.format).toBe("single");
  });

  it("infers multi-select when format says single but two answers are marked correct", () => {
    const base = minimalValidPayload("SECURE");
    const r = validateGeneratedQuestionPayload({
      ...base,
      format: "single",
      options: base.options.map((o, i) => ({
        ...o,
        isCorrect: i === 1 || i === 2,
        explanation:
          i === 1 || i === 2 ?
            o.explanation
          : "Incorrect distractor explanation text here for validation length.",
      })),
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.format).toBe("multiple");
  });

  it("respects allowedDomainCodes when validating domainCode", () => {
    const ok = validateGeneratedQuestionPayload(minimalValidPayload("CUSTOM"), {
      allowedDomainCodes: ["CUSTOM"],
    });
    expect(ok.ok).toBe(true);

    const bad = validateGeneratedQuestionPayload(minimalValidPayload("SECURE"), {
      allowedDomainCodes: ["CUSTOM"],
    });
    expect(bad.ok).toBe(false);
  });

  it("rejects missing reasoning on correct answers", () => {
    const r = validateGeneratedQuestionPayload({
      stem:
        "A company runs an API behind Amazon API Gateway and wants to throttle abusive clients per API key without maintaining server-side sessions. What should the architect do?",
      format: "single",
      domainCode: "SECURE",
      options: [
        { position: 0, text: "A", isCorrect: false },
        { position: 1, text: "B", isCorrect: true, explanation: "short" },
        { position: 2, text: "C", isCorrect: false },
        { position: 3, text: "D", isCorrect: false },
      ],
    });
    expect(r.ok).toBe(false);
  });
});
