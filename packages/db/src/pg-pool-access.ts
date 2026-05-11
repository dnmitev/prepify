import type { Pool } from "pg";
import type { DbClient } from "./db-types.js";

const pgPoolByDb = new WeakMap<DbClient, Pool>();

export function registerDbPool(db: DbClient, pool: Pool): void {
  pgPoolByDb.set(db, pool);
}

export function getPgPool(db: DbClient): Pool {
  const pool = pgPoolByDb.get(db);
  if (!pool) {
    throw new Error("getPgPool: client was not created via createDb() from @prepify/db");
  }
  return pool;
}
