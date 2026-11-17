import path from "node:path";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import type { DbKind, Db } from "./index";

export const MIGRATIONS_FOLDER = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "drizzle");

/** Aplikuje brakujące migracje z katalogu ./drizzle (idempotentne). */
export async function runMigrations(handle: { db: Db; kind: DbKind }, migrationsFolder = MIGRATIONS_FOLDER) {
  if (handle.kind === "pglite") {
    await migratePglite(handle.db as any, { migrationsFolder });
  } else {
    await migratePg(handle.db as any, { migrationsFolder });
  }
}
