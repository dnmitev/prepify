const DEFAULT_MAX = 50;

export function maxQuestionsPerJobFromEnv(getEnv: (name: string) => string | undefined): number {
  const raw = getEnv("GENERATION_MAX_QUESTIONS_PER_JOB")?.trim();
  if (!raw) return DEFAULT_MAX;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX;
  return n;
}

/** Validates optional client-supplied batch size for POST /jobs/generate. */
export function parseQuestionCount(
  raw: unknown,
  maxAllowed: number,
): { ok: true; value: number } | { ok: false; error: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, value: 1 };
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    return { ok: false, error: "questionCount must be an integer" };
  }
  if (raw < 1) {
    return { ok: false, error: "questionCount must be at least 1" };
  }
  if (raw > maxAllowed) {
    return { ok: false, error: `questionCount must not exceed ${maxAllowed}` };
  }
  return { ok: true, value: raw };
}
