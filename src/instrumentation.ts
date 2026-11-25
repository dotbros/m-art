/**
 * Uruchamiane raz przy starcie serwera Next.js.
 * W trybie dev automatycznie aplikuje migracje, wgrywa dane demo do pustej bazy (SEED_DEMO_DATA=true)
 * i tworzy konto admina z ADMIN_EMAIL / ADMIN_PASSWORD, jeśli żadnego jeszcze nie ma.
 * Na serwerze migracje: `npm run db:migrate` albo AUTO_MIGRATE=true.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { bootstrap } = await import("./lib/bootstrap");
  await bootstrap();
}
