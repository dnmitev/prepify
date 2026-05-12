import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type TableRef = { __table: string } & Record<string, unknown>;
type FakeDbState = {
  insertedQuestions: unknown[];
  insertedOptionBatches: unknown[];
  updates: { table: string; values: Record<string, unknown> }[];
};

const mocks = vi.hoisted(() => {
  const column = (table: string, name: string) => ({ table, name });
  const tables = {
    domains: {
      __table: "domains",
      id: column("domains", "id"),
      examTypeId: column("domains", "examTypeId"),
      code: column("domains", "code"),
      name: column("domains", "name"),
      weightPercent: column("domains", "weightPercent"),
    },
    examTypes: {
      __table: "examTypes",
      id: column("examTypes", "id"),
      code: column("examTypes", "code"),
      name: column("examTypes", "name"),
    },
    generationJobs: {
      __table: "generationJobs",
      id: column("generationJobs", "id"),
    },
    questionOptions: {
      __table: "questionOptions",
      id: column("questionOptions", "id"),
    },
    questions: {
      __table: "questions",
      id: column("questions", "id"),
    },
  };

  return {
    embedText: vi.fn(),
    insertQuestionEmbedding: vi.fn(),
    recordLlmUsage: vi.fn(),
    recordQuestionGenerationCandidateAttempt: vi.fn(),
    recordSkippedDuplicateQuestionCandidate: vi.fn(),
    runQuestionGenerationModel: vi.fn(),
    searchQuestionEmbeddingNeighbors: vi.fn(),
    tables,
    workerDb: vi.fn(),
  };
});

vi.mock("drizzle-orm", () => ({
  and: (...conditions: unknown[]) => ({ op: "and", conditions }),
  asc: (column: unknown) => ({ op: "asc", column }),
  eq: (left: unknown, right: unknown) => ({ op: "eq", left, right }),
}));

vi.mock("@prepify/db", () => ({
  ...mocks.tables,
  QUESTION_EMBEDDING_DIMENSION: 384,
  insertQuestionEmbedding: mocks.insertQuestionEmbedding,
  recordQuestionGenerationCandidateAttempt: mocks.recordQuestionGenerationCandidateAttempt,
  recordSkippedDuplicateQuestionCandidate: mocks.recordSkippedDuplicateQuestionCandidate,
  searchQuestionEmbeddingNeighbors: mocks.searchQuestionEmbeddingNeighbors,
}));

vi.mock("./db-client.js", () => ({
  workerDb: mocks.workerDb,
}));

vi.mock("./embeddings.js", () => ({
  embedText: mocks.embedText,
}));

vi.mock("./llm-usage.js", () => ({
  recordLlmUsage: mocks.recordLlmUsage,
}));

vi.mock("./post-exam-training-activities.js", () => ({
  postExamTrainingEmbedActivity: vi.fn(),
  postExamTrainingPrepareActivity: vi.fn(),
  postExamTrainingSummarizeActivity: vi.fn(),
  postExamTrainingTeachActivity: vi.fn(),
}));

vi.mock("./question-generation.js", () => ({
  runQuestionGenerationModel: mocks.runQuestionGenerationModel,
}));

const { generateQuestionItem } = await import("./activities.js");

const envKeys = [
  "LLM_ROLE_EMBEDDING_MODEL",
  "LLM_ROLE_EMBEDDING_PROVIDER",
  "QUESTION_DUPLICATE_HARD_THRESHOLD",
  "QUESTION_DUPLICATE_REVIEW_THRESHOLD",
] as const;

const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]])) as Record<
  (typeof envKeys)[number],
  string | undefined
>;

const examRow = {
  id: "exam-type-1",
  code: "SAA-C03",
  name: "AWS Certified Solutions Architect - Associate",
};

const domainRow = {
  id: "domain-secure",
  examTypeId: examRow.id,
  code: "SECURE",
  name: "Design Secure Architectures",
  weightPercent: 30,
};

const candidateEmbedding = Array.from({ length: 384 }, (_, index) => (index === 0 ? 1 : 0));

function generatedPayload() {
  return {
    stem:
      "A company is building an AWS workload that must keep static credentials out of application servers while preserving detailed audit trails.",
    format: "single",
    domainCode: "SECURE",
    options: [
      {
        position: 0,
        text: "Use long-lived IAM user access keys stored in an encrypted file on each server.",
        isCorrect: false,
        explanation: "Long-lived keys increase leakage risk and do not satisfy the constraint.",
      },
      {
        position: 1,
        text: "Use IAM roles with least-privilege policies and record activity with AWS CloudTrail.",
        isCorrect: true,
        explanation: "IAM roles avoid static secrets and CloudTrail provides durable activity records.",
      },
      {
        position: 2,
        text: "Share one administrator account across all application hosts and rotate its password monthly.",
        isCorrect: false,
        explanation: "Shared credentials reduce accountability and are not appropriate for workload access.",
      },
      {
        position: 3,
        text: "Disable audit logging for the application role to reduce log ingestion cost.",
        isCorrect: false,
        explanation: "Disabling audit logging conflicts with the requirement to preserve activity records.",
      },
    ],
  };
}

class FakeSelectBuilder implements PromiseLike<unknown[]> {
  private table: TableRef | null = null;

  constructor(
    private readonly selection: unknown,
  ) {}

  from(table: TableRef): this {
    this.table = table;
    return this;
  }

  where(_condition: unknown): this {
    return this;
  }

  orderBy(_order: unknown): this {
    return this;
  }

  then<TResult1 = unknown[], TResult2 = never>(
    onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<unknown[]> {
    if (this.table === mocks.tables.examTypes) {
      return [examRow];
    }
    if (this.table === mocks.tables.domains) {
      return this.selection ? [domainRow] : [domainRow];
    }
    throw new Error(`Unhandled fake select table ${this.table?.__table ?? "unknown"}`);
  }
}

function createFakeDb(state: FakeDbState) {
  return {
    insert(table: TableRef) {
      return {
        values(value: unknown) {
          if (table === mocks.tables.questions) {
            state.insertedQuestions.push(value);
            return {
              returning: async () => [{ id: "question-new" }],
            };
          }
          if (table === mocks.tables.questionOptions) {
            state.insertedOptionBatches.push(value);
            return Promise.resolve();
          }
          throw new Error(`Unhandled fake insert table ${table.__table}`);
        },
      };
    },
    select(selection?: unknown) {
      return new FakeSelectBuilder(selection);
    },
    update(table: TableRef) {
      return {
        set(values: Record<string, unknown>) {
          state.updates.push({ table: table.__table, values });
          return {
            where: async () => undefined,
          };
        },
      };
    },
  };
}

function baseInput(overrides: Partial<Parameters<typeof generateQuestionItem>[0]> = {}) {
  return {
    jobId: "generation-job-1",
    examTypeCode: "SAA-C03",
    topicHint: "identity and audit controls",
    summarize: false,
    summaryFromSummarization: null,
    environmentLabel: "test",
    workflowId: "workflow-1",
    questionCount: 1,
    iterationIndex: 0,
    acceptedQuestionIndex: 0,
    candidateAttemptNumber: 1,
    ...overrides,
  };
}

let state: FakeDbState;
let db: ReturnType<typeof createFakeDb>;

beforeEach(() => {
  state = { insertedQuestions: [], insertedOptionBatches: [], updates: [] };
  db = createFakeDb(state);
  mocks.workerDb.mockReturnValue(db);
  mocks.runQuestionGenerationModel.mockResolvedValue({
    raw: generatedPayload(),
    inputTokens: 11,
    outputTokens: 23,
  });
  mocks.embedText.mockResolvedValue({
    embedding: candidateEmbedding,
    inputTokens: 7,
  });
  mocks.searchQuestionEmbeddingNeighbors.mockResolvedValue([]);

  process.env["LLM_ROLE_EMBEDDING_PROVIDER"] = "mock";
  process.env["LLM_ROLE_EMBEDDING_MODEL"] = "test-embedding-model";
  process.env["QUESTION_DUPLICATE_HARD_THRESHOLD"] = "0.94";
  process.env["QUESTION_DUPLICATE_REVIEW_THRESHOLD"] = "0.88";
});

afterEach(() => {
  for (const key of envKeys) {
    const original = originalEnv[key];
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
  vi.clearAllMocks();
});

describe("generateQuestionItem duplicate gate", () => {
  it("skips a high-similarity duplicate before persisting question rows", async () => {
    mocks.searchQuestionEmbeddingNeighbors.mockResolvedValueOnce([
      {
        questionId: "near-question-1",
        canonicalTextHash: "existing-hash",
        embeddingModel: "test-embedding-model",
        distance: 0.03,
        similarity: 0.97,
      },
    ]);

    const result = await generateQuestionItem(baseInput({ candidateAttemptNumber: 2 }));

    expect(result).toEqual({
      ok: false,
      reason: "duplicate",
      nearestQuestionId: "near-question-1",
      similarity: 0.97,
    });
    expect(state.insertedQuestions).toEqual([]);
    expect(state.insertedOptionBatches).toEqual([]);
    expect(mocks.insertQuestionEmbedding).not.toHaveBeenCalled();
    expect(mocks.recordQuestionGenerationCandidateAttempt).toHaveBeenCalledWith(db, {
      jobId: "generation-job-1",
      candidateAttemptNumber: 2,
    });
    expect(mocks.recordSkippedDuplicateQuestionCandidate).toHaveBeenCalledWith(db, {
      jobId: "generation-job-1",
      candidateAttemptNumber: 2,
      nearestQuestionId: "near-question-1",
      similarity: 0.97,
      threshold: 0.94,
      canonicalTextHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
  });

  it("persists a below-threshold candidate and stores its embedding", async () => {
    mocks.searchQuestionEmbeddingNeighbors.mockResolvedValueOnce([
      {
        questionId: "far-question-1",
        canonicalTextHash: "existing-hash",
        embeddingModel: "test-embedding-model",
        distance: 0.45,
        similarity: 0.55,
      },
    ]);

    const result = await generateQuestionItem(baseInput());

    expect(result).toEqual({ ok: true, questionId: "question-new" });
    expect(state.insertedQuestions).toEqual([
      expect.objectContaining({
        examTypeId: examRow.id,
        domainId: domainRow.id,
        stem: generatedPayload().stem,
        format: "single",
        provenance: "ai-generated",
        generationJobId: "generation-job-1",
      }),
    ]);
    expect(state.insertedOptionBatches).toHaveLength(1);
    expect(mocks.insertQuestionEmbedding).toHaveBeenCalledWith(db, {
      questionId: "question-new",
      examTypeId: examRow.id,
      domainId: domainRow.id,
      canonicalTextHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      embedding: candidateEmbedding,
      embeddingModel: "test-embedding-model",
    });
    expect(mocks.recordSkippedDuplicateQuestionCandidate).not.toHaveBeenCalled();
    expect(state.updates.at(-1)?.values).toEqual(
      expect.objectContaining({
        completedQuestionCount: 1,
        status: "succeeded",
        errorMessage: null,
      }),
    );
  });
});
