import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/**
 * Baza: MariaDB 10.11 / MySQL 8 — lokalnie (przenośna MariaDB, port 3307) i na serwerze (D-018).
 * Adres w DATABASE_URL, np. mysql://mart:haslo@127.0.0.1:3307/mart
 * Opcjonalnie DATABASE_SOCKET=/var/lib/mysql/mysql.sock — połączenie przez gniazdo UNIX (hosting).
 */
export type Db = MySql2Database<typeof schema>;
export type DbKind = "mysql";

type Handle = { db: Db; kind: DbKind; close: () => Promise<void> };

export type Env = Record<string, string | undefined>;

export function resolveDatabaseConfig(env: Env = process.env): { kind: DbKind; target: string } {
  const url = env.DATABASE_URL?.trim();
  if (!url || !/^(mysql|mariadb):\/\//.test(url)) {
    throw new Error("Brak DATABASE_URL (np. mysql://mart:mart-local@127.0.0.1:3307/mart). Lokalnie uruchom bazę: npm run db:start — szczegóły w SRODOWISKO.md.");
  }
  return { kind: "mysql", target: url.replace(/^mariadb:/, "mysql:") };
}

/** Ustawienia puli połączeń (bez nazwy bazy — używane też do zakładania baz testowych). */
export function connectionOptions(url: string, env: Env = process.env): mysql.PoolOptions {
  const u = new URL(url);
  const socket = env.DATABASE_SOCKET?.trim();
  return {
    ...(socket ? { socketPath: socket } : { host: u.hostname, port: Number(u.port || 3306) }),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, "")) || undefined,
    charset: "utf8mb4_unicode_ci",
    timezone: "Z", // daty zapisujemy i czytamy w UTC
    connectionLimit: Number(env.DATABASE_POOL_MAX || 5),
    waitForConnections: true,
    enableKeepAlive: true,
  };
}

/** Tworzy nowe połączenie. Używane przez aplikację (singleton niżej), skrypty i testy. */
export async function createDb(env: Env = process.env): Promise<Handle> {
  const { target } = resolveDatabaseConfig(env);
  const pool = mysql.createPool(connectionOptions(target, env));
  // CURRENT_TIMESTAMP w bazie też w UTC — niezależnie od strefy ustawionej na serwerze hostingu.
  pool.pool.on("connection", (conn) => { conn.query("SET time_zone = '+00:00'"); });
  await pool.query("SELECT 1"); // od razu czytelny błąd, gdy baza nie działa
  return { kind: "mysql", db: drizzle(pool, { schema, mode: "default" }), close: () => pool.end() };
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
