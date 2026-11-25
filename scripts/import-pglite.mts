import "./_env.mts";
import { readFileSync } from "node:fs";
import { getTableColumns, sql } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import { createDb } from "../src/db/index.ts";
import { runMigrations } from "../src/db/migrate.ts";
import * as schema from "../src/db/schema.ts";

// Jednorazowe przeniesienie danych z eksportu PGlite (scripts/export-pglite.mts) do MariaDB (D-018).
// Użycie: npx tsx scripts/import-pglite.mts [plik.json]   — baza docelowa z DATABASE_URL, musi być PUSTA.
const file = process.argv[2] ?? "./data/export-pglite.json";
const dump = JSON.parse(readFileSync(file, "utf8")) as Record<string, Record<string, unknown>[]>;

// Kolejność zgodna z kluczami obcymi.
const TABLES: [string, MySqlTable][] = [
  ["categories", schema.categories], ["products", schema.products], ["stones", schema.stones], ["pages", schema.pages],
  ["hero_slides", schema.heroSlides], ["orders", schema.orders], ["order_items", schema.orderItems],
  ["subscribers", schema.subscribers], ["messages", schema.messages], ["admin_users", schema.adminUsers], ["admin_sessions", schema.adminSessions],
];

const handle = await createDb();
try {
  await runMigrations(handle);
  const db = handle.db;
  const [{ value }] = await db.select({ value: sql<number>`count(*)` }).from(schema.categories);
  if (Number(value) > 0) { console.error("✖ Baza docelowa nie jest pusta — przerwano (npm run db:reset, potem ponów)."); process.exit(1); }
  // Treści startowe z migracji (slajdy, podstrony, kamienie) zastępujemy danymi z eksportu.
  for (const t of [schema.heroSlides, schema.pages, schema.stones]) await db.delete(t);
  for (const [name, table] of TABLES) {
    const columns = Object.entries(getTableColumns(table));
    const rows = (dump[name] ?? []).map((raw) => {
      const row: Record<string, unknown> = {};
      for (const [key, col] of columns) {
        if (!(col.name in raw)) continue;
        let v = raw[col.name];
        if (v !== null && col.columnType === "MySqlDateTime") v = new Date(v as string);
        row[key] = v;
      }
      return row;
    });
    if (rows.length) await db.insert(table).values(rows as never);
    console.log(`${name}: ${rows.length}`);
  }
  console.log("✔ Dane przeniesione.");
} finally {
  await handle.close();
}
