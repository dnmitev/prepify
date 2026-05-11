import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { attempts, examTypes } from "@prepify/db";
import pg from "pg";
import type { FastifyInstance } from "fastify";
import { createDb } from "@prepify/db";
import { buildServer } from "./server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, "../../../packages/db/drizzle");

describe("GET /attempts (resumable list)", () => {
  let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
  let app: FastifyInstance;
  let examId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    const databaseUrl = container.getConnectionUri();
    process.env["DATABASE_URL"] = databaseUrl;

    const pool = new pg.Pool({ connectionString: databaseUrl });
    const migrationDb = drizzle(pool);
    await migrate(migrationDb, { migrationsFolder });
    await pool.end();

    examId = randomUUID();
    const seedDb = createDb(databaseUrl);
    await seedDb.insert(examTypes).values({
      id: examId,
      code: "SAA-C03",
      name: "Test Exam",
      durationMinutes: 120,
      totalQuestions: 65,
      unscoredCount: 15,
      passingScaledScore: 720,
    });
    await seedDb.$client.end();

    app = await buildServer();
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  it("includes active and paused, excludes submitted/expired, and expires stale active rows", async () => {
    const databaseUrl = process.env["DATABASE_URL"];
    if (!databaseUrl) throw new Error("DATABASE_URL missing");
    const db = createDb(databaseUrl);

    const activeOk = randomUUID();
    const pausedOk = randomUUID();
    const submittedId = randomUUID();
    const expiredStaticId = randomUUID();
    const staleActiveId = randomUUID();
    const longAgo = new Date(Date.now() - 60 * 60 * 1000);

    await db.insert(attempts).values([
      {
        id: activeOk,
        examTypeId: examId,
        status: "active",
        remainingActiveSeconds: 600,
        lastActivityAt: new Date(),
      },
      {
        id: pausedOk,
        examTypeId: examId,
        status: "paused",
        remainingActiveSeconds: 300,
        lastActivityAt: new Date(),
        pausedAt: new Date(),
      },
      {
        id: submittedId,
        examTypeId: examId,
        status: "submitted",
        remainingActiveSeconds: 0,
        lastActivityAt: new Date(),
        submittedAt: new Date(),
      },
      {
        id: expiredStaticId,
        examTypeId: examId,
        status: "expired",
        remainingActiveSeconds: 0,
        lastActivityAt: new Date(),
      },
      {
        id: staleActiveId,
        examTypeId: examId,
        status: "active",
        remainingActiveSeconds: 10,
        lastActivityAt: longAgo,
      },
    ]);

    const res = await app.inject({ method: "GET", url: "/attempts" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as {
      attempts: { id: string; status: string; examTypeCode: string; remainingActiveSeconds: number }[];
    };

    const ids = body.attempts.map((a) => a.id);
    expect(ids).toContain(activeOk);
    expect(ids).toContain(pausedOk);
    expect(ids).not.toContain(submittedId);
    expect(ids).not.toContain(expiredStaticId);
    expect(ids).not.toContain(staleActiveId);

    const [staleRow] = await db.select().from(attempts).where(eq(attempts.id, staleActiveId));
    expect(staleRow?.status).toBe("expired");

    const activeEntry = body.attempts.find((a) => a.id === activeOk);
    expect(activeEntry?.examTypeCode).toBe("SAA-C03");
    expect(activeEntry?.remainingActiveSeconds).toBe(600);

    await db.$client.end();
  });
});
