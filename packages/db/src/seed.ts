import path from "node:path";
import { fileURLToPath } from "node:url";
import { count, eq, inArray } from "drizzle-orm";
import { createDb } from "./index.js";
import {
  attemptItems,
  attempts,
  domains,
  examTypes,
  questionOptions,
  questions,
  responses,
} from "./schema.js";
import {
  domainCodeForPracticeQuestion,
  expandPracticeBank,
  loadPracticeBankFromRepo,
} from "./parse-practice-md.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function repoRoot(): string {
  return path.resolve(__dirname, "../../..");
}

async function forceReplaceQuestionBank(
  db: ReturnType<typeof createDb>,
  examTypeId: string,
): Promise<void> {
  const attemptRows = await db.select({ id: attempts.id }).from(attempts).where(eq(attempts.examTypeId, examTypeId));
  const attemptIds = attemptRows.map((a) => a.id);
  if (attemptIds.length > 0) {
    await db.delete(responses).where(inArray(responses.attemptId, attemptIds));
    await db.delete(attemptItems).where(inArray(attemptItems.attemptId, attemptIds));
    await db.delete(attempts).where(inArray(attempts.id, attemptIds));
  }

  const questionRows = await db.select({ id: questions.id }).from(questions).where(eq(questions.examTypeId, examTypeId));
  const qIds = questionRows.map((q) => q.id);
  if (qIds.length > 0) {
    await db.delete(questionOptions).where(inArray(questionOptions.questionId, qIds));
    await db.delete(questions).where(eq(questions.examTypeId, examTypeId));
  }
}

export async function seed(): Promise<void> {
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error("DATABASE_URL is required for seed");
  }
  const db = createDb(url);

  let examRow = (await db.select().from(examTypes).where(eq(examTypes.code, "SAA-C03")))[0];

  if (!examRow) {
    const [inserted] = await db
      .insert(examTypes)
      .values({
        code: "SAA-C03",
        name: "AWS Certified Solutions Architect – Associate",
        durationMinutes: 120,
        totalQuestions: 65,
        unscoredCount: 15,
        passingScaledScore: 720,
      })
      .returning();
    examRow = inserted!;
  }

  const domainSeeds = [
    { code: "SECURE", name: "Design Secure Architectures", weightPercent: 30 },
    { code: "RESILIENT", name: "Design Resilient Architectures", weightPercent: 26 },
    { code: "PERF", name: "Design High-Performing Architectures", weightPercent: 24 },
    { code: "COST", name: "Design Cost-Optimized Architectures", weightPercent: 20 },
  ] as const;

  let domainRows = await db.select().from(domains).where(eq(domains.examTypeId, examRow.id));
  if (domainRows.length === 0) {
    await db.insert(domains).values(
      domainSeeds.map((d) => ({
        examTypeId: examRow!.id,
        code: d.code,
        name: d.name,
        weightPercent: d.weightPercent,
      })),
    );
    domainRows = await db.select().from(domains).where(eq(domains.examTypeId, examRow.id));
  }

  const root = repoRoot();
  const { questions: canonical, answers } = loadPracticeBankFromRepo(root);
  if (canonical.size !== 30 || answers.size !== 30) {
    throw new Error(
      `Practice bank incomplete: questions=${canonical.size}, answers=${answers.size} (expected 30 each).`,
    );
  }
  const expanded = expandPracticeBank(canonical, answers, examRow.totalQuestions);

  const existingCountRows = await db
    .select({ value: count() })
    .from(questions)
    .where(eq(questions.examTypeId, examRow.id));
  const existingCount = existingCountRows[0]?.value ?? 0;

  const force = process.env["SEED_FORCE_QUESTION_BANK"] === "1";
  if (force || existingCount === 0) {
    if (existingCount > 0 && force) {
      // eslint-disable-next-line no-console
      console.warn("SEED_FORCE_QUESTION_BANK=1: deleting existing attempts and questions for SAA-C03.");
      await forceReplaceQuestionBank(db, examRow.id);
    }

    for (const row of expanded) {
      const pq = canonical.get(row.practiceNumber);
      if (!pq) {
        throw new Error(`Canonical question Q${row.practiceNumber} missing`);
      }

      const domainCode = domainCodeForPracticeQuestion(row.practiceNumber);
      const domain = domainRows.find((d) => d.code === domainCode);
      if (!domain) {
        throw new Error(`Domain ${domainCode} not found`);
      }

      const sortedOpts = [...pq.options].sort((a, b) => a.letter.localeCompare(b.letter));

      const [q] = await db
        .insert(questions)
        .values({
          examTypeId: examRow.id,
          domainId: domain.id,
          stem: row.stem,
          format: row.format,
          provenance:
            row.passTag === 0 ? "practice_md" : `practice_md_cycle_${String(row.passTag + 1)}`,
        })
        .returning();

      await db.insert(questionOptions).values(
        sortedOpts.map((opt, position) => ({
          questionId: q!.id,
          position,
          text: opt.text,
          isCorrect: row.correctPositions.includes(position),
          explanation: null,
        })),
      );
    }
  }

  const totalRows = await db
    .select({ value: count() })
    .from(questions)
    .where(eq(questions.examTypeId, examRow.id));
  const total = totalRows[0]?.value ?? 0;
  // eslint-disable-next-line no-console
  console.log(`Seed complete: exam SAA-C03, questions=${total}`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
