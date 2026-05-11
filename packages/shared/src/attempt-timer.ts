export type AttemptClockStatus = "active" | "paused" | "submitted" | "expired";

/**
 * Apply wall-clock decay for an active attempt. Paused attempts do not lose time.
 * Uses whole seconds for simplicity (matches typical UI granularity).
 */
export function applyActiveDecay(
  status: AttemptClockStatus,
  remainingSeconds: number,
  lastActivityAt: Date,
  now: Date,
): { remainingSeconds: number; expired: boolean } {
  if (status !== "active") {
    return { remainingSeconds, expired: remainingSeconds <= 0 };
  }
  const elapsedSec = Math.floor((now.getTime() - lastActivityAt.getTime()) / 1000);
  if (elapsedSec <= 0) {
    return { remainingSeconds, expired: remainingSeconds <= 0 };
  }
  const next = Math.max(0, remainingSeconds - elapsedSec);
  return { remainingSeconds: next, expired: next <= 0 };
}
