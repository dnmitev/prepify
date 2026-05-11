import { describe, expect, it } from "vitest";
import { applyActiveDecay } from "./attempt-timer.js";

describe("applyActiveDecay", () => {
  it("does not decay while paused", () => {
    const now = new Date("2026-01-01T00:10:00Z");
    const last = new Date("2026-01-01T00:00:00Z");
    const r = applyActiveDecay("paused", 3600, last, now);
    expect(r.remainingSeconds).toBe(3600);
    expect(r.expired).toBe(false);
  });

  it("decays while active", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-01T00:05:30Z");
    const r = applyActiveDecay("active", 3600, last, now);
    expect(r.remainingSeconds).toBe(3600 - 330);
    expect(r.expired).toBe(false);
  });

  it("expires when time runs out", () => {
    const last = new Date("2026-01-01T00:00:00Z");
    const now = new Date("2026-01-01T01:00:01Z");
    const r = applyActiveDecay("active", 60, last, now);
    expect(r.remainingSeconds).toBe(0);
    expect(r.expired).toBe(true);
  });
});
