import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Testy E2E uruchamiają PRODUKCYJNY build (`next build && next start`) na osobnej, czyszczonej bazie
 * MariaDB `mart_e2e` (lokalna MariaDB musi działać: npm run db:start) — tak, jak aplikacja będzie działać na serwerze.
 * Priorytet: telefony (Pixel 7 = Chrome/Android, iPhone 14 = Safari/WebKit), potem desktop.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1, // testy współdzielą jedną bazę i zmieniają jej dane — idą po kolei
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 45_000,
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", screenshot: "only-on-failure", locale: "pl-PL" },
  projects: [
    { name: "mobile-android", use: { ...devices["Pixel 7"] } },
    { name: "mobile-iphone", use: { ...devices["iPhone 14"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 860 } } },
  ],
  webServer: {
    command: `node -e "require('fs').rmSync('storage/e2e',{recursive:true,force:true})" && npx tsx scripts/reset-db.mts && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: process.env.E2E_DATABASE_URL || "mysql://mart:mart-local@127.0.0.1:3307/mart_e2e",
      UPLOAD_DIR: "./storage/e2e",
      SEED_DEMO_DATA: "true",
      AUTO_MIGRATE: "true",
      ADMIN_EMAIL: "e2e@mart.local",
      ADMIN_PASSWORD: "E2eHaslo12345",
      COOKIE_SECURE: "false",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
