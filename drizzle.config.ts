import { defineConfig } from "drizzle-kit";

// `npm run db:generate` porównuje schemat z poprzednimi migracjami i tworzy nowy plik SQL w ./drizzle.
// Migracje to SQL dla MariaDB/MySQL — te same lokalnie i na serwerze (D-018).
export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
