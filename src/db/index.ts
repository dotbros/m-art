import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Wspólny typ bazy dla obu sterowników (PGlite lokalnie, PostgreSQL na serwerze).
 * Zapytania Drizzle są identyczne — różni się tylko sposób połączenia.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export type DbKind = "postgres" | "pglite";

type Handle = { db: Db; kind: DbKind; close: () => Promise<void> };

/** Zwraca, z jakiej bazy korzystamy, na podstawie zmiennych środowiskowych. */
export type Env = Record<string, string | undefined>;

export function resolveDatabaseConfig(env: Env = process.env): { kind: DbKind; target: string } {
  const url = env.DATABASE_URL?.trim();
  if (url && /^postgres(ql)?:\/\//.test(url)) return { kind: "postgres", target: url };
  const dir = env.PGLITE_DIR?.trim() || "./data/pglite";
  return { kind: "pglite", target: dir };
}

/** Tworzy nowe połączenie. Używane przez aplikację (singleton niżej), skrypty i testy. */
export async function createDb(env: Env = process.env): Promise<Handle> {
  const config = resolveDatabaseConfig(env);
  if (config.kind === "postgres") {
    const pool = new Pool({ connectionString: config.target, max: Number(env.DATABASE_POOL_MAX || 10) });
    return { kind: "postgres", db: drizzlePg(pool, { schema }) as unknown as Db, close: () => pool.end() };
  }
  const inMemory = config.target.startsWith("memory://");
  const dataDir = inMemory ? config.target : path.resolve(/*turbopackIgnore: true*/ config.target);
  let releaseLock = () => {};
  if (!inMemory) {
    mkdirSync(dataDir, { recursive: true });
    releaseLock = acquireLock(dataDir);
  }
  const client = new PGlite(dataDir);
  await client.waitReady;
  return { kind: "pglite", db: drizzlePglite(client, { schema }) as unknown as Db, close: async () => { await client.close(); releaseLock(); } };
}

/**
 * PGlite może być otwarte tylko przez JEDEN proces naraz. Plik blokady chroni przed
 * uszkodzeniem bazy, gdy np. `npm run db:seed` zostanie uruchomione przy działającym `npm run dev`.
 */
function acquireLock(dataDir: string): () => void {
  const lockFile = path.join(/*turbopackIgnore: true*/ path.dirname(dataDir), `${path.basename(dataDir)}.lock`);
  if (existsSync(lockFile)) {
    const pid = Number(readFileSync(lockFile, "utf8"));
    if (pid && pid !== process.pid && isAlive(pid)) {
      throw new Error(`Baza lokalna (${dataDir}) jest używana przez inny proces (PID ${pid}). Zatrzymaj serwer (npm run dev / npm start) i spróbuj ponownie.`);
    }
  }
  writeFileSync(lockFile, String(process.pid));
  const release = () => { try { if (readFileSync(lockFile, "utf8") === String(process.pid)) unlinkSync(lockFile); } catch { /* już usunięty */ } };
  process.once("exit", release);
  return release;
}

function isAlive(pid: number) {
  try { process.kill(pid, 0); return true; } catch (error) { return (error as NodeJS.ErrnoException).code === "EPERM"; }
}

const globalForDb = globalThis as typeof globalThis & { __martDb?: Promise<Handle> };

/** Jedno współdzielone połączenie na proces serwera (przetrwa hot-reload w trybie dev). */
export function getDbHandle(): Promise<Handle> {
  if (!globalForDb.__martDb) {
    globalForDb.__martDb = createDb().catch((error) => {
      globalForDb.__martDb = undefined;
      throw error;
    });
  }
  return globalForDb.__martDb;
}

export async function getDb(): Promise<Db> {
  return (await getDbHandle()).db;
}

/** Tylko dla testów: podmienia współdzielone połączenie. */
export function setDbHandleForTests(handle: Handle | undefined) {
  globalForDb.__martDb = handle ? Promise.resolve(handle) : undefined;
}
