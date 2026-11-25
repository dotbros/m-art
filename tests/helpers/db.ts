import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import { connectionOptions, createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { seedDemoData } from "@/lib/seed";

/**
 * Świeża, osobna baza MariaDB dla każdego testu (mart_t_<losowe>) z migracjami i opcjonalnie danymi demo.
 * Po `close()` baza jest usuwana. Serwer: TEST_DATABASE_URL (domyślnie lokalna MariaDB na porcie 3307).
 */
const SERVER = process.env.TEST_DATABASE_URL || "mysql://mart:mart-local@127.0.0.1:3307/mart_test";

export async function createTestDb({ seed = true } = {}) {
  const name = `mart_t_${randomBytes(5).toString("hex")}`;
  const admin = await mysql.createConnection({ ...connectionOptions(SERVER, {}), database: undefined });
  await admin.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  const url = new URL(SERVER);
  url.pathname = `/${name}`;
  const handle = await createDb({ DATABASE_URL: url.toString(), DATABASE_POOL_MAX: "3" });
  await runMigrations(handle);
  if (seed) await seedDemoData(handle.db);
  return {
    ...handle,
    close: async () => {
      await handle.close();
      await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
      await admin.end();
    },
  };
}
