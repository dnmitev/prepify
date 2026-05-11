import { describe, expect, it } from "vitest";

describe("integration (skipped by default)", () => {
  it.skipIf(!process.env["RUN_INTEGRATION"])("requires Postgres via RUN_INTEGRATION=1", async () => {
    expect(process.env["DATABASE_URL"]).toBeTruthy();
  });
});
