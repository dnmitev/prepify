import { describe, expect, it } from "vitest";
import { validatePostExamTeachingText } from "./post-exam-teaching.js";

describe("validatePostExamTeachingText", () => {
  it("accepts sufficiently long English teaching copy", () => {
    const text = "A".repeat(40);
    expect(validatePostExamTeachingText(text)).toEqual({ ok: true, value: text });
  });

  it("rejects short output", () => {
    const r = validatePostExamTeachingText("too short");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
  });
});
