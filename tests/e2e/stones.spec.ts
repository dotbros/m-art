import { expect, test, type Page } from "@playwright/test";

const noHorizontalScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

test.describe("Kamienie naturalne — strony dla klienta", () => {
  test("strona główna → karta kamienia → strona kamienia z opisem i biżuterią → produkt w sklepie", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#kamienie");
    await expect(section.getByRole("heading", { name: /Każdy kamień/ })).toBeVisible();
    await section.getByRole("link", { name: /Jaspis cesarski/ }).click();

    await expect(page).toHaveURL(/\/kamienie\/jaspis-cesarski$/);
    await expect(page.getByRole("heading", { level: 1, name: "Jaspis cesarski" })).toBeVisible();
    await expect(page.locator(".stone-caption")).toHaveText("Ciepło ziemi");
    await expect(page.locator(".stone-description p").first()).toContainText("ciepłymi odcieniami");
    await expect(page).toHaveTitle(/Jaspis cesarski — kamień naturalny/);
    await noHorizontalScroll(page);

    const product = page.locator(".stone-product").filter({ hasText: "Słoneczny splot" });
    await expect(product).toBeVisible();
    await expect(page.locator(".stone-product").filter({ hasText: "Perłowa opowieść" })).toHaveCount(0); // perła, nie jaspis
    await product.click();
    await expect(page).toHaveURL(/\/$/); // adres wyczyszczony po otwarciu karty
    await expect(page.locator(".product-modal").getByRole("heading", { name: "Słoneczny splot" })).toBeVisible();
  });

  test("lista wszystkich kamieni i nieistniejący kamień", async ({ page }) => {
    await page.goto("/kamienie");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kamienie");
    await expect(page.locator(".stones-index-grid .stone-card")).toHaveCount(await page.locator(".stones-index-grid .stone-card").count());
    expect(await page.locator(".stones-index-grid .stone-card").count()).toBeGreaterThanOrEqual(3);
    await noHorizontalScroll(page);
    const res = await page.goto("/kamienie/nie-ma-takiego-kamienia");
    expect(res?.status()).toBe(404);
  });
});

test.describe("Kamienie naturalne — panel", () => {
  test("nowy kamień ze zdjęciem i opisem → przypisanie do produktu → strona kamienia i strona główna", async ({ page }, info) => {
    test.setTimeout(90_000);
    const name = `Opal ${info.project.name}`;
    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill("e2e@mart.local");
    await page.getByLabel("Hasło").fill("E2eHaslo12345");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page.getByRole("heading", { name: /Witaj/ })).toBeVisible();

    await page.getByRole("navigation", { name: "Panel administracyjny" }).getByRole("link", { name: "Kamienie" }).click();
    await expect(page.getByRole("heading", { name: "Kamienie", level: 1 })).toBeVisible();
    await noHorizontalScroll(page);
    await page.getByRole("link", { name: "+ Nowy" }).click();
    await page.getByLabel("Nazwa kamienia").fill(name);
    await page.getByLabel("Krótki podpis").fill("Ogień w kamieniu");
    await page.getByLabel("Opis", { exact: true }).fill("Opal mieni się wszystkimi kolorami tęczy.\n\nKażdy jest inny.");
    await page.locator("#media-file").setInputFiles("tests/fixtures/hero.jpg");
    await expect(page.getByAltText("Zdjęcie 1")).toBeVisible({ timeout: 30_000 });
    await page.getByLabel(/Pokaż w sekcji/).check();
    await noHorizontalScroll(page);
    await page.getByRole("button", { name: "Dodaj kamień" }).click();
    await expect(page.getByText("Kamień został zapisany.")).toBeVisible();

    // Przypisanie kamienia do produktu — kamień jest w podpowiedziach formularza
    await page.goto("/admin/produkty/kolczyki-jaspis");
    await page.getByRole("button", { name: `+ ${name}` }).click();
    await page.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(page.getByText("Produkt został zapisany.")).toBeVisible();

    // Strona kamienia: zdjęcie z /media, opis w akapitach, produkt
    const slug = `opal-${info.project.name}`;
    await page.goto(`/kamienie/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.locator(".stone-description p")).toHaveCount(2);
    await expect(page.locator(".stone-gallery-main img")).toHaveAttribute("src", /^\/media\/[a-f0-9]{32}\.jpg$/);
    await expect(page.locator(".stone-product").filter({ hasText: "Piaskowe szepty" })).toBeVisible();

    // Strona główna: karta kamienia w sekcji
    await page.goto("/");
    await expect(page.locator("#kamienie").getByRole("link", { name: new RegExp(name) })).toBeVisible();

    // Kamienia użytego w produkcie nie da się usunąć
    await page.goto("/admin/kamienie");
    await page.getByRole("link", { name: new RegExp(name) }).click();
    await page.getByRole("button", { name: "Usuń kamień" }).click();
    await page.getByRole("button", { name: "Tak, usuń" }).click();
    await expect(page.locator(".adm-alert-error")).toContainText("kamień jest w produktach");
  });
});
