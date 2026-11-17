import "./_env.mts";
import { rmSync } from "node:fs";
import path from "node:path";
import { resolveDatabaseConfig } from "../src/db/index.ts";

// Usuwa LOKALNĄ bazę PGlite. Celowo nie działa dla PostgreSQL (ochrona przed skasowaniem danych na serwerze).
const config = resolveDatabaseConfig();
if (config.kind !== "pglite" || config.target.startsWith("memory://")) {
  console.error("✖ db:reset działa tylko dla lokalnej bazy PGlite.");
  process.exit(1);
}
const dir = path.resolve(config.target);
rmSync(dir, { recursive: true, force: true });
rmSync(`${dir}.lock`, { force: true });
console.log(`✔ Usunięto lokalną bazę: ${dir}. Uruchom: npm run setup`);
