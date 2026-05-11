const MIN_LEN = 40;
const MAX_LEN = 48_000;

/**
 * Validates aggregate post-exam teaching copy (English-only by convention; not locale-detected here).
 */
export function validatePostExamTeachingText(raw: string): { ok: true; value: string } | { ok: false; errors: string[] } {
  const text = raw.trim();
  if (text.length < MIN_LEN) {
    return { ok: false, errors: [`teaching text must be at least ${String(MIN_LEN)} characters`] };
  }
  if (text.length > MAX_LEN) {
    return { ok: false, errors: [`teaching text must be at most ${String(MAX_LEN)} characters`] };
  }
  return { ok: true, value: text };
}
