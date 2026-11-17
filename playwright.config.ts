import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Testy E2E uruchamiają PRODUKCYJNY build (`next build && next start`) na osobnej, czystej bazie
 * (./data/pglite-e2e) — tak, jak aplikacja będzie działać na serwerze.
 * Priorytet: telefony (Pixel 7 = Chrome/Android, iPhone 14 = Safari/WebKit), potem desktop.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1, // PGlite obsługuje jeden proces — testy idą po kolei
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
    command: `node -e "require('fs').rmSync('data/pglite-e2e',{recursive:true,force:true});require('fs').rmSync('data/pglite-e2e.lock',{force:true});require('fs').rmSync('storage/e2e',{recursive:true,force:true})" && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      PGLITE_DIR: "./data/pglite-e2e",
      DATABASE_URL: "",
      UPLOAD_DIR: "./storage/e2e",
      SEED_DEMO_DATA: "true",
      AUTO_MIGRATE: "true",
      ADMIN_EMAIL: "e2e@mart.local",
      ADMIN_PASSWORD: "E2eHaslo12345",
      COOKIE_SECURE: "false",
    },
  },
});
