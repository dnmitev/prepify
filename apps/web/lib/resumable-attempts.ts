export type ResumableAttempt = {
  id: string;
  examTypeCode: string;
  status: string;
  remainingActiveSeconds: number;
  createdAt: string;
  lastActivityAt: string;
};

export function formatAttemptClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m)}:${String(s).padStart(2, "0")}`;
}
