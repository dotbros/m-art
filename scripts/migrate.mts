import "./_env.mts";
import { createDb } from "../src/db/index.ts";
import { runMigrations } from "../src/db/migrate.ts";

const handle = await createDb();
try {
  await runMigrations(handle);
  console.log(`✔ Migracje zastosowane (${handle.kind}).`);
} finally {
  await handle.close();
}
