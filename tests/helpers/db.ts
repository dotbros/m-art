import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { seedDemoData } from "@/lib/seed";

/** Świeża baza PGlite w pamięci z zastosowanymi migracjami (i opcjonalnie danymi demo). */
export async function createTestDb({ seed = true } = {}) {
  const handle = await createDb({ PGLITE_DIR: "memory://" });
  await runMigrations(handle);
  if (seed) await seedDemoData(handle.db);
  return handle;
}
