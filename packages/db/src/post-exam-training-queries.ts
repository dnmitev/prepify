import { asc, eq } from "drizzle-orm";
import type { DbClient } from "./db-types.js";
import {
  attemptItems,
  attempts,
  examTypes,
  questionOptions,
  questions,
  responses,
} from "./schema.js";

export type IncorrectScoredItemPayload = {
  questionId: string;
  stem: string;
  format: string;
  options: { position: number; text: string; isCorrect: boolean }[];
  selectedPositions: number[];
};

export type PostExamTrainingLoadResult = {
  attemptId: string;
  examTypeCode: string;
  incorrectItems: IncorrectScoredItemPayload[];
};

/**
 * Loads scored (non-unscored) items the learner answered incorrectly for a finalized attempt.
 */
export async function loadPostExamTrainingContext(
  db: DbClient,
  attemptId: string,
): Promise<PostExamTrainingLoadResult | null> {
  const attemptRow = (await db.select().from(attempts).where(eq(attempts.id, attemptId)))[0];
  if (!attemptRow) return null;
  if (attemptRow.status !== "submitted" && attemptRow.status !== "expired") return null;

  const exam = (await db.select().from(examTypes).where(eq(examTypes.id, attemptRow.examTypeId)))[0];
  if (!exam) return null;

  const items = await db.select().from(attemptItems).where(eq(attemptItems.attemptId, attemptId));
  const scoredItems = items.filter((i) => !i.isUnscored);
  const respRows = await db.select().from(responses).where(eq(responses.attemptId, attemptId));
  const respByQuestion = new Map(respRows.map((r) => [r.questionId, r.selectedPositions]));

  const incorrectItems: IncorrectScoredItemPayload[] = [];

  for (const item of scoredItems) {
    const opts = await db
      .select()
      .from(questionOptions)
      .where(eq(questionOptions.questionId, item.questionId))
      .orderBy(asc(questionOptions.position));

    const correctPositions = opts
      .filter((o) => o.isCorrect)
      .map((o) => o.position)
      .sort((a, b) => a - b);
    const selected = (respByQuestion.get(item.questionId) ?? []).slice().sort((a, b) => a - b);

    const isCorrect =
      correctPositions.length === selected.length &&
      correctPositions.every((v, idx) => v === selected[idx]);

    if (isCorrect) continue;

    const qRow = (await db.select().from(questions).where(eq(questions.id, item.questionId)))[0];
    if (!qRow) continue;

    incorrectItems.push({
      questionId: qRow.id,
      stem: qRow.stem,
      format: qRow.format,
      options: opts.map((o) => ({ position: o.position, text: o.text, isCorrect: o.isCorrect })),
      selectedPositions: selected,
    });
  }

  return {
    attemptId,
    examTypeCode: exam.code,
    incorrectItems,
  };
}
