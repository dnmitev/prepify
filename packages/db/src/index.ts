import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import type { DbClient } from "./db-types.js";
import { registerDbPool, getPgPool } from "./pg-pool-access.js";
import * as schema from "./schema.js";

export type { DbClient };

export { getPgPool };

export function createDb(connectionString: string): DbClient {
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool, { schema });
  registerDbPool(db, pool);
  return db;
}

export * from "./schema.js";
export * from "./training-constants.js";
export * from "./post-exam-training-queries.js";
export * from "./post-exam-training-repo.js";
export * from "./question-embedding-repo.js";
