// Zrzuty ekranów (telefon 390 px) do przeglądu UX: `npx tsx scripts/screenshots.mts http://localhost:3100 ./docs/zrzuty`
import { mkdirSync } from "node:fs";
import { chromium, devices } from "@playwright/test";

const [base = "http://localhost:3100", out = "./docs/zrzuty"] = process.argv.slice(2);
const email = process.env.SHOT_EMAIL || "e2e@mart.local";
const password = process.env.SHOT_PASSWORD || "E2eHaslo12345";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await (await browser.newContext({ ...devices["iPhone 14"], locale: "pl-PL", deviceScaleFactor: 1 })).newPage();
const shot = (name: string, fullPage = false) => page.screenshot({ path: `${out}/${name}.png`, fullPage });

await page.goto(base); await shot("01-sklep-start");
await page.evaluate(() => document.getElementById("kolekcja")?.scrollIntoView()); await page.waitForTimeout(1200); await shot("02-sklep-kolekcja");
await page.locator(".product-card .product-image-button").first().click(); await page.waitForTimeout(400); await shot("03-sklep-produkt");
await page.goto(`${base}/admin/login`); await shot("04-admin-logowanie");
await page.getByLabel("E-mail").fill(email); await page.getByLabel("Hasło").fill(password);
await page.getByRole("button", { name: "Zaloguj się" }).click(); await page.waitForURL(/\/admin$/);
await shot("05-admin-pulpit");
await page.goto(`${base}/admin/produkty`); await shot("06-admin-produkty");
await page.goto(`${base}/admin/produkty/nowy`); await shot("07-admin-nowy-produkt");
await page.getByRole("button", { name: "Dodaj produkt" }).click(); await page.waitForTimeout(600); await shot("08-admin-bledy-walidacji");
await page.goto(`${base}/admin/zamowienia`); await shot("09-admin-zamowienia");
await browser.close();
console.log(`✔ Zrzuty zapisane w ${out}`);
