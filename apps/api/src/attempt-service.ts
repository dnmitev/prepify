import { count, desc, eq, inArray } from "drizzle-orm";
import type { DbClient } from "@prepify/db";
import { attemptItems, attempts, domains, examTypes, questionOptions, questions, responses } from "@prepify/db";
import { applyActiveDecay, type AttemptClockStatus, passesExam, scaledScoreFromAccuracy } from "@prepify/shared";

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i]!, arr[j]!] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export async function syncAttemptClock(
  db: DbClient,
  attemptId: string,
  now = new Date(),
): Promise<typeof attempts.$inferSelect> {
  const [row] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!row) {
    throw new Error("Attempt not found");
  }
  if (row.status === "submitted" || row.status === "expired") {
    return row;
  }
  const st = row.status as AttemptClockStatus;
  const { remainingSeconds, expired } = applyActiveDecay(
    st,
    row.remainingActiveSeconds,
    row.lastActivityAt,
    now,
  );

  if (st === "paused") {
    return row;
  }

  let nextStatus = st;
  let submittedAt = row.submittedAt;

  if (expired) {
    nextStatus = "expired";
    submittedAt = now;
  }

  const [updated] = await db
    .update(attempts)
    .set({
      remainingActiveSeconds: expired ? 0 : remainingSeconds,
      lastActivityAt: expired ? row.lastActivityAt : now,
      status: nextStatus,
      submittedAt,
    })
    .where(eq(attempts.id, attemptId))
    .returning();

  return updated!;
}

export type ResumableAttemptSummary = {
  id: string;
  examTypeCode: string;
  status: string;
  remainingActiveSeconds: number;
  createdAt: Date;
  lastActivityAt: Date;
};

/**
 * Lists attempts that can still be opened in the exam UI (`active` or `paused`).
 * Applies `syncAttemptClock` for each **active** row so expiry matches `GET /attempts/:id`.
 */
export async function listResumableAttempts(
  db: DbClient,
  now = new Date(),
): Promise<ResumableAttemptSummary[]> {
  const baseRows = await db
    .select({
      attemptId: attempts.id,
      examTypeCode: examTypes.code,
      status: attempts.status,
      remainingActiveSeconds: attempts.remainingActiveSeconds,
      createdAt: attempts.createdAt,
      lastActivityAt: attempts.lastActivityAt,
    })
    .from(attempts)
    .innerJoin(examTypes, eq(attempts.examTypeId, examTypes.id))
    .where(inArray(attempts.status, ["active", "paused"]))
    .orderBy(desc(attempts.lastActivityAt));

  const out: ResumableAttemptSummary[] = [];
  for (const row of baseRows) {
    if (row.status === "active") {
      const synced = await syncAttemptClock(db, row.attemptId, now);
      if (synced.status === "submitted" || synced.status === "expired") {
        continue;
      }
      out.push({
        id: synced.id,
        examTypeCode: row.examTypeCode,
        status: synced.status,
        remainingActiveSeconds: synced.remainingActiveSeconds,
        createdAt: synced.createdAt,
        lastActivityAt: synced.lastActivityAt,
      });
    } else {
      out.push({
        id: row.attemptId,
        examTypeCode: row.examTypeCode,
        status: row.status,
        remainingActiveSeconds: row.remainingActiveSeconds,
        createdAt: row.createdAt,
        lastActivityAt: row.lastActivityAt,
      });
    }
  }
  return out;
}

export async function startAttempt(db: DbClient, examTypeCode: string) {
  const exam = (await db.select().from(examTypes).where(eq(examTypes.code, examTypeCode)))[0];
  if (!exam) throw new Error("Exam type not found");

  const qCountRows = await db
    .select({ value: count() })
    .from(questions)
    .where(eq(questions.examTypeId, exam.id));
  const qCount = qCountRows[0]?.value ?? 0;

  if (qCount < exam.totalQuestions) {
    throw new Error(`Question bank too small: need ${exam.totalQuestions}, have ${qCount}`);
  }

  const allQuestionRows = await db.select({ id: questions.id }).from(questions).where(eq(questions.examTypeId, exam.id));

  const ids = shuffleInPlace(allQuestionRows.map((q) => q.id)).slice(0, exam.totalQuestions);

  const unscoredPositions = new Set(
    shuffleInPlace([...Array.from({ length: exam.totalQuestions }, (_, i) => i)]).slice(0, exam.unscoredCount),
  );

  const now = new Date();
  const durationSeconds = exam.durationMinutes * 60;

  const [attemptRow] = await db
    .insert(attempts)
    .values({
      examTypeId: exam.id,
      status: "active",
      remainingActiveSeconds: durationSeconds,
      lastActivityAt: now,
    })
    .returning();

  await db.insert(attemptItems).values(
    ids.map((questionId, position) => ({
      attemptId: attemptRow!.id,
      questionId,
      position,
      isUnscored: unscoredPositions.has(position),
    })),
  );

  return attemptRow!;
}

export async function calculateAttemptOutcome(db: DbClient, attemptId: string) {
  const attemptRow = (await db.select().from(attempts).where(eq(attempts.id, attemptId)))[0];
  if (!attemptRow) throw new Error("Attempt missing");

  const exam = (await db.select().from(examTypes).where(eq(examTypes.id, attemptRow.examTypeId)))[0];
  if (!exam) throw new Error("Exam missing");

  const items = await db.select().from(attemptItems).where(eq(attemptItems.attemptId, attemptId));

  const scoredItems = items.filter((i) => !i.isUnscored);
  const respRows = await db.select().from(responses).where(eq(responses.attemptId, attemptId));
  const respByQuestion = new Map(respRows.map((r) => [r.questionId, r.selectedPositions]));

  let correct = 0;
  const domainStats = new Map<string, { correct: number; total: number }>();

  for (const item of scoredItems) {
    const opts = await db.select().from(questionOptions).where(eq(questionOptions.questionId, item.questionId));

    const correctPositions = opts
      .filter((o) => o.isCorrect)
      .map((o) => o.position)
      .sort((a, b) => a - b);
    const selected = (respByQuestion.get(item.questionId) ?? []).slice().sort((a, b) => a - b);

    const isCorrect =
      correctPositions.length === selected.length &&
      correctPositions.every((v, idx) => v === selected[idx]);

    if (isCorrect) correct += 1;

    const qRow = (await db.select().from(questions).where(eq(questions.id, item.questionId)))[0];
    if (!qRow) continue;
    const domainRow = (await db.select().from(domains).where(eq(domains.id, qRow.domainId)))[0];
    const key = domainRow?.code ?? "UNKNOWN";
    const cur = domainStats.get(key) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (isCorrect) cur.correct += 1;
    domainStats.set(key, cur);
  }

  const fraction = scoredItems.length > 0 ? correct / scoredItems.length : 0;
  const scaled = scaledScoreFromAccuracy(fraction);
  const passed = passesExam(scaled, exam.passingScaledScore);

  return {
    scaledScore: scaled,
    passed,
    rawCorrect: correct,
    scoredCount: scoredItems.length,
    fractionCorrect: fraction,
    domainBreakdown: [...domainStats.entries()].map(([code, v]) => ({
      code,
      correct: v.correct,
      total: v.total,
      fraction: v.total ? v.correct / v.total : 0,
    })),
    disclaimer:
      "Scaled score is an approximation for practice only and does not guarantee AWS exam outcomes.",
  };
}

export async function scoreAttempt(db: DbClient, attemptId: string) {
  const attemptRow = await syncAttemptClock(db, attemptId);

  const outcome = await calculateAttemptOutcome(db, attemptId);

  if (attemptRow.scaledScore != null) {
    return outcome;
  }

  await db
    .update(attempts)
    .set({
      scaledScore: outcome.scaledScore,
      passed: outcome.passed,
      status: attemptRow.status === "expired" ? "expired" : "submitted",
      submittedAt: attemptRow.submittedAt ?? new Date(),
    })
    .where(eq(attempts.id, attemptId));

  return outcome;
}
