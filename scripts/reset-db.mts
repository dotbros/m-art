import "./_env.mts";
import mysql from "mysql2/promise";
import { connectionOptions, resolveDatabaseConfig } from "../src/db/index.ts";

// Czyści LOKALNĄ bazę (usuwa i zakłada ją od nowa). Celowo działa tylko dla 127.0.0.1/localhost
// — ochrona przed skasowaniem danych na serwerze.
const { target } = resolveDatabaseConfig();
const opts = connectionOptions(target);
if (!["127.0.0.1", "localhost"].includes(String(opts.host)) || opts.socketPath) {
  console.error("✖ db:reset działa tylko dla lokalnej bazy (127.0.0.1 / localhost).");
  process.exit(1);
}
const name = String(opts.database);
const conn = await mysql.createConnection({ ...opts, database: undefined });
await conn.query(`DROP DATABASE IF EXISTS \`${name}\``);
await conn.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await conn.end();
console.log(`✔ Wyczyszczono lokalną bazę ${name}. Uruchom: npm run setup`);
