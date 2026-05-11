/** Linear scaled score 100–1000 from raw fraction correct on scored items (0..1). */
export function scaledScoreFromAccuracy(fractionCorrect: number): number {
  const clamped = Math.min(1, Math.max(0, fractionCorrect));
  return Math.round(100 + clamped * 900);
}

export function passesExam(scaledScore: number, passingThreshold: number): boolean {
  return scaledScore >= passingThreshold;
}
