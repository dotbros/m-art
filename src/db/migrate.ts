import path from "node:path";
import { migrate } from "drizzle-orm/mysql2/migrator";
import type { Db } from "./index";

export const MIGRATIONS_FOLDER = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "drizzle");

/** Aplikuje brakujące migracje z katalogu ./drizzle (idempotentne). */
export async function runMigrations(handle: { db: Db }, migrationsFolder = MIGRATIONS_FOLDER) {
  await migrate(handle.db, { migrationsFolder });
}
