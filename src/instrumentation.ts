/**
 * Uruchamiane raz przy starcie serwera Next.js.
 * Lokalnie (PGlite) automatycznie aplikuje migracje, wgrywa dane demo do pustej bazy
 * i tworzy konto admina z ADMIN_EMAIL / ADMIN_PASSWORD, jeśli żadnego jeszcze nie ma.
 * Na serwerze z PostgreSQL migracje uruchamia się jawnie: `npm run db:migrate`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { bootstrap } = await import("./lib/bootstrap");
  await bootstrap();
}
