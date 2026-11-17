import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// `npm run db:generate` porównuje schemat z poprzednimi migracjami i tworzy nowy plik SQL w ./drizzle.
// Migracje są zwykłym SQL-em PostgreSQL — działają tak samo w PGlite (lokalnie) i na serwerze.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
