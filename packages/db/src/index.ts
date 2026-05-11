import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

export type DbClient = ReturnType<typeof drizzle<typeof schema>>;

export function createDb(connectionString: string): DbClient {
  const pool = new pg.Pool({ connectionString });
  return drizzle(pool, { schema });
}

export * from "./schema.js";
