import { createDb, type DbClient } from "@prepify/db";

let _db: DbClient | undefined;

export function workerDb(): DbClient {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is required for worker activities");
  _db ??= createDb(url);
  return _db;
}
