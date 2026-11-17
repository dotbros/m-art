// Szybkie uruchomienie testów E2E na już działającym serwerze deweloperskim (bez budowania):
//   E2E_BASE_URL=http://localhost:3200 npx playwright test -c playwright.dev.config.ts tests/e2e/storefront.spec.ts
import base from "./playwright.config";

export default { ...base, webServer: undefined, use: { ...base.use, baseURL: process.env.E2E_BASE_URL || "http://localhost:3200" } };
