import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { createDb } from "@prepify/db";
import {
  attemptItems,
  attempts,
  domains,
  examTypes,
  generationJobs,
  llmUsageEvents,
  questionOptions,
  questions,
  responses,
} from "@prepify/db";
import { validateQuestionStructure } from "@prepify/shared";
import { scoreAttempt, startAttempt, syncAttemptClock } from "./attempt-service.js";

const env = process.env;

function corsOriginOption(): boolean | RegExp | string | string[] {
  const raw = env["CORS_ORIGIN"]?.trim();
  if (raw === "*") {
    return true;
  }
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return ["http://localhost:3000", "http://127.0.0.1:3000"];
}

export async function buildServer(): Promise<FastifyInstance> {
  const dbUrl = env["DATABASE_URL"] ?? "postgresql://prepify:prepify@localhost:5432/prepify";
  const db = createDb(dbUrl);

  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: corsOriginOption(),
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  app.get("/health", async () => ({ ok: true }));

  app.get("/exams", async () => {
    return db.select().from(examTypes);
  });

  app.get("/exams/:code", async (req, reply) => {
    const code = (req.params as { code: string }).code;
    const exam = (await db.select().from(examTypes).where(eq(examTypes.code, code)))[0];
    if (!exam) {
      return reply.code(404).send({ error: "Not found" });
    }
    const doms = await db.select().from(domains).where(eq(domains.examTypeId, exam.id));
    return { exam, domains: doms };
  });

  app.get("/questions", async (req, reply) => {
    const examTypeCode = (req.query as { examTypeCode?: string }).examTypeCode;
    if (!examTypeCode) return reply.code(400).send({ error: "examTypeCode required" });
    const exam = (await db.select().from(examTypes).where(eq(examTypes.code, examTypeCode)))[0];
    if (!exam) return reply.code(404).send({ error: "Exam not found" });

    const qs = await db.select().from(questions).where(eq(questions.examTypeId, exam.id));
    const out = [];
    for (const q of qs) {
      const opts = await db.select().from(questionOptions).where(eq(questionOptions.questionId, q.id));
      out.push({
        ...q,
        options: opts.map((o) => ({
          position: o.position,
          text: o.text,
          isCorrect: o.isCorrect,
          explanation: o.explanation,
        })),
      });
    }
    return out;
  });

  app.post("/questions", async (req, reply) => {
    const body = req.body as {
      examTypeCode: string;
      domainCode: string;
      stem: string;
      format: "single" | "multiple";
      provenance?: string;
      options: { position: number; text: string; isCorrect: boolean; explanation?: string }[];
    };

    const exam = (await db.select().from(examTypes).where(eq(examTypes.code, body.examTypeCode)))[0];
    if (!exam) return reply.code(404).send({ error: "Exam not found" });

    const domain = (
      await db
        .select()
        .from(domains)
        .where(and(eq(domains.examTypeId, exam.id), eq(domains.code, body.domainCode)))
    )[0];
    if (!domain) return reply.code(404).send({ error: "Domain not found" });

    const validation = validateQuestionStructure({
      format: body.format,
      options: body.options.map((o) => ({ position: o.position, isCorrect: o.isCorrect })),
    });
    if (!validation.ok) return reply.code(400).send({ error: validation.errors.join(" ") });

    const [q] = await db
      .insert(questions)
      .values({
        examTypeId: exam.id,
        domainId: domain.id,
        stem: body.stem,
        format: body.format,
        provenance: body.provenance ?? "author",
      })
      .returning();

    await db.insert(questionOptions).values(
      body.options.map((o) => ({
        questionId: q!.id,
        position: o.position,
        text: o.text,
        isCorrect: o.isCorrect,
        explanation: o.explanation ?? null,
      })),
    );

    return { id: q!.id };
  });

  app.post("/attempts", async (req, reply) => {
    const body = req.body as { examTypeCode: string };
    try {
      const attemptRow = await startAttempt(db, body.examTypeCode);
      return { attemptId: attemptRow.id };
    } catch (e) {
      app.log.error(e);
      return reply.code(400).send({ error: (e as Error).message });
    }
  });

  app.get("/attempts/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    let attemptRow: typeof attempts.$inferSelect;
    try {
      attemptRow = await syncAttemptClock(db, id);
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }

    if (attemptRow.status === "submitted" || attemptRow.status === "expired") {
      const exam = (await db.select().from(examTypes).where(eq(examTypes.id, attemptRow.examTypeId)))[0];
      return {
        attempt: {
          id: attemptRow.id,
          status: attemptRow.status,
          remainingActiveSeconds: attemptRow.remainingActiveSeconds,
          scaledScore: attemptRow.scaledScore,
          passed: attemptRow.passed,
          examTypeCode: exam?.code,
        },
        questions: [],
      };
    }

    const items = await db.select().from(attemptItems).where(eq(attemptItems.attemptId, id));

    const qs = [];
    for (const item of items.sort((a, b) => a.position - b.position)) {
      const qRow = (await db.select().from(questions).where(eq(questions.id, item.questionId)))[0];
      if (!qRow) continue;
      const opts = await db.select().from(questionOptions).where(eq(questionOptions.questionId, qRow.id));
      const resp = (
        await db
          .select()
          .from(responses)
          .where(and(eq(responses.attemptId, id), eq(responses.questionId, qRow.id)))
      )[0];

      qs.push({
        position: item.position,
        questionId: qRow.id,
        stem: qRow.stem,
        format: qRow.format,
        options: opts.map((o) => ({ position: o.position, text: o.text })),
        selectedPositions: resp?.selectedPositions ?? [],
      });
    }

    const exam = (await db.select().from(examTypes).where(eq(examTypes.id, attemptRow.examTypeId)))[0];

    return {
      attempt: {
        id: attemptRow.id,
        status: attemptRow.status,
        remainingActiveSeconds: attemptRow.remainingActiveSeconds,
        examTypeCode: exam?.code,
      },
      questions: qs,
    };
  });

  app.patch("/attempts/:id/pause", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const row = await syncAttemptClock(db, id);
    if (row.status !== "active") return reply.code(400).send({ error: "Attempt not active" });
    const now = new Date();
    await db
      .update(attempts)
      .set({ status: "paused", pausedAt: now, lastActivityAt: now })
      .where(eq(attempts.id, id));
    return { ok: true };
  });

  app.patch("/attempts/:id/resume", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const row = (await db.select().from(attempts).where(eq(attempts.id, id)))[0];
    if (!row) return reply.code(404).send({ error: "Not found" });
    if (row.status !== "paused") return reply.code(400).send({ error: "Attempt not paused" });
    const now = new Date();
    await db
      .update(attempts)
      .set({ status: "active", pausedAt: null, lastActivityAt: now })
      .where(eq(attempts.id, id));
    return { ok: true };
  });

  app.patch("/attempts/:id/answers", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as { questionId: string; selectedPositions: number[] };
    const row = await syncAttemptClock(db, id);
    if (row.status !== "active" && row.status !== "paused") {
      return reply.code(400).send({ error: "Attempt not editable" });
    }

    await db
      .insert(responses)
      .values({
        attemptId: id,
        questionId: body.questionId,
        selectedPositions: body.selectedPositions,
      })
      .onConflictDoUpdate({
        target: [responses.attemptId, responses.questionId],
        set: { selectedPositions: body.selectedPositions },
      });

    return { ok: true };
  });

  app.post("/attempts/:id/submit", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    await syncAttemptClock(db, id);
    const row = (await db.select().from(attempts).where(eq(attempts.id, id)))[0];
    if (!row) return reply.code(404).send({ error: "Not found" });
    if (row.status === "submitted") {
      return scoreAttempt(db, id);
    }
    if (row.status === "expired") {
      return scoreAttempt(db, id);
    }

    await db
      .update(attempts)
      .set({ status: "submitted", submittedAt: new Date() })
      .where(eq(attempts.id, id));

    return scoreAttempt(db, id);
  });

  app.get("/admin/usage/summary", async (req) => {
    const jobId = (req.query as { jobId?: string }).jobId;
    const base = db.select().from(llmUsageEvents);
    const rows = jobId
      ? await db.select().from(llmUsageEvents).where(eq(llmUsageEvents.jobId, jobId as unknown as string))
      : await base;

    const byRole = new Map<string, { input: number; output: number }>();
    for (const r of rows) {
      const cur = byRole.get(r.role) ?? { input: 0, output: 0 };
      cur.input += r.inputTokens ?? 0;
      cur.output += r.outputTokens ?? 0;
      byRole.set(r.role, cur);
    }

    return {
      events: rows.length,
      byRole: [...byRole.entries()].map(([role, v]) => ({ role, ...v })),
    };
  });

  app.post("/jobs/generate", async (req, reply) => {
    const temporalAddress = env["TEMPORAL_ADDRESS"];
    if (!temporalAddress) {
      return reply.code(503).send({ error: "TEMPORAL_ADDRESS not configured" });
    }

    const { Connection, Client } = await import("@temporalio/client");
    const connection = await Connection.connect({ address: temporalAddress });
    const client = new Client({ connection, namespace: env["TEMPORAL_NAMESPACE"] ?? "default" });

    const jobId = randomUUID();
    const workflowId = jobId;
    const taskQueue = env["TEMPORAL_TASK_QUEUE"] ?? "prepify-main";

    const body = req.body as {
      examTypeCode?: unknown;
      topicHint?: unknown;
      summarize?: unknown;
    };

    const examTypeCode =
      typeof body.examTypeCode === "string" ? body.examTypeCode.trim() : "";
    if (!examTypeCode) {
      return reply.code(400).send({
        error: "examTypeCode is required (legacy { topic } only requests are no longer supported)",
      });
    }

    const examRow = (await db.select().from(examTypes).where(eq(examTypes.code, examTypeCode)))[0];
    if (!examRow) {
      return reply.code(400).send({ error: `Unknown exam type code: ${examTypeCode}` });
    }

    const topicHint =
      typeof body.topicHint === "string" && body.topicHint.trim() ? body.topicHint.trim() : null;
    const summarize = body.summarize === true;

    await db.insert(generationJobs).values({
      id: jobId,
      temporalWorkflowId: workflowId,
      status: "queued",
      topic: null,
      examTypeCode,
      topicHint,
    });

    await client.workflow.start("generateQuestionWorkflow", {
      taskQueue,
      workflowId,
      args: [
        {
          jobId,
          examTypeCode,
          topicHint,
          summarize,
          environmentLabel: env["APP_ENV"] ?? "development",
        },
      ],
    });

    return { jobId, workflowId };
  });

  app.get("/jobs/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const job = (await db.select().from(generationJobs).where(eq(generationJobs.id, id)))[0];
    if (!job) return reply.code(404).send({ error: "Not found" });
    const genQ = (
      await db.select({ id: questions.id }).from(questions).where(eq(questions.generationJobId, id)).limit(1)
    )[0];
    return { ...job, generatedQuestionId: genQ?.id ?? null };
  });

  return app;
}
