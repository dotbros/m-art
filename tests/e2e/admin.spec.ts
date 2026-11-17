import { expect, test, type Page } from "@playwright/test";

const ADMIN = { email: "e2e@mart.local", password: "E2eHaslo12345" };

// Najmniejszy poprawny plik PNG 1×1 — do testu uploadu zdjęcia.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(ADMIN.email);
  await page.getByLabel("Hasło").fill(ADMIN.password);
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page.getByRole("heading", { name: /Witaj/ })).toBeVisible();
}

test.describe("Panel administracyjny", () => {
  test("bez logowania panel przekierowuje do strony logowania", async ({ page }) => {
    await page.goto("/admin/produkty");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("złe hasło pokazuje komunikat i nie wpuszcza", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill(ADMIN.email);
    await page.getByLabel("Hasło").fill("zle-haslo-xyz");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page.locator(".adm-alert-error")).toContainText("Nieprawidłowy e-mail lub hasło");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });

  test("nawigacja panelu jest dostępna i nie wychodzi poza ekran", async ({ page }) => {
    await login(page);
    const nav = page.getByRole("navigation", { name: "Panel administracyjny" });
    await expect(nav.getByRole("link", { name: "Produkty" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await nav.getByRole("link", { name: "Zamówienia" }).click();
    await expect(page.getByRole("heading", { name: "Zamówienia" })).toBeVisible();
  });

  test("tworzenie kategorii i produktu ze zdjęciem — produkt pojawia się w sklepie", async ({ page }, info) => {
    const suffix = `${info.project.name}-${Date.now().toString(36)}`;
    const categoryName = `Broszki ${suffix}`;
    const productName = `Testowa broszka ${suffix}`;
    await login(page);

    // Kategoria
    await page.goto("/admin/kategorie/nowa");
    await page.getByLabel("Nazwa kategorii").fill(categoryName);
    await page.getByRole("button", { name: "Dodaj kategorię" }).click();
    await expect(page.getByText("Kategoria została zapisana.")).toBeVisible();
    await expect(page.getByText(categoryName)).toBeVisible();

    // Produkt — formularz mieści się w ekranie telefonu, potem błąd walidacji ceny
    await page.goto("/admin/produkty/nowy");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Dodaj produkt" })).toBeInViewport();
    await page.getByLabel("Nazwa produktu").fill(productName);
    await page.getByLabel("Kategoria").selectOption({ label: categoryName });
    await page.getByLabel("Cena (zł)", { exact: true }).fill("abc");
    await page.getByRole("button", { name: "Dodaj produkt" }).click();
    await expect(page.getByText("Podaj cenę, np. 189,00.")).toBeVisible();
    // Wpisane dane nie znikają po błędzie walidacji
    await expect(page.getByLabel("Nazwa produktu")).toHaveValue(productName);

    await page.getByLabel("Cena (zł)", { exact: true }).fill("249,50");
    await page.getByLabel("Stan magazynowy (szt.)").fill("3");
    await page.getByLabel("Kamień").fill("Kwarc różowy");
    await page.getByLabel("Wybierz lub zrób zdjęcie").setInputFiles({ name: "broszka.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByAltText("Podgląd zdjęcia produktu")).toBeVisible();
    await page.getByRole("button", { name: "Dodaj produkt" }).click();
    await expect(page.getByText("Produkt został zapisany.")).toBeVisible();

    // Sklep pokazuje nowy produkt, cenę i nową kategorię; zdjęcie jest serwowane z /media
    await page.goto("/");
    const card = page.locator(".product-card").filter({ hasText: productName });
    await page.getByRole("tab", { name: categoryName }).click();
    await expect(card).toBeVisible();
    await expect(card).toContainText("249,50");
    const src = await card.locator("img").getAttribute("src");
    expect(src).toMatch(/^\/media\/[a-f0-9]{32}\.png$/);
    expect((await page.request.get(src!)).status()).toBe(200);

    // Ukrycie produktu w panelu usuwa go ze sklepu
    await page.goto(`/admin/produkty?q=${encodeURIComponent(productName)}`);
    await page.getByRole("button", { name: `Ukryj ${productName} w sklepie` }).click();
    await expect(page.getByRole("button", { name: `Pokaż ${productName} w sklepie` })).toBeVisible();
    await page.goto("/");
    await expect(page.locator(".product-card").filter({ hasText: productName })).toHaveCount(0);
  });

  test("kategorii z produktami nie da się usunąć", async ({ page }) => {
    await login(page);
    await page.goto("/admin/kategorie");
    await page.getByRole("link", { name: /Naszyjniki/ }).click();
    await page.getByRole("button", { name: "Usuń kategorię" }).click();
    await page.getByRole("button", { name: "Tak, usuń" }).click();
    await expect(page.locator(".adm-alert-error")).toContainText("kategoria zawiera produkty");
  });

  test("obsługa zamówienia: zmiana statusu i numer przesyłki", async ({ page, request }) => {
    const res = await request.post("/api/orders", { data: { email: "jan@example.pl", name: "Jan Test", phone: "600200300", street: "Leśna 5", postalCode: "30-001", city: "Kraków", delivery: "courier", consent: true, items: [{ id: "naszyjnik-perla", quantity: 1 }] } });
    expect(res.status()).toBe(201);
    const { number } = await res.json();
    await login(page);
    await page.goto("/admin/zamowienia");
    await page.getByRole("link", { name: new RegExp(number) }).click();
    await expect(page.getByRole("heading", { name: number })).toBeVisible();
    await expect(page.getByText("Leśna 5")).toBeVisible();
    await page.getByLabel("Status zamówienia").selectOption({ label: "Wysłane" });
    await page.getByLabel("Numer przesyłki").fill("620000000000000000000001");
    await page.getByRole("button", { name: "Zapisz zmiany" }).click();
    await expect(page.getByText("Zapisano zmiany zamówienia.")).toBeVisible();
  });

  test("wylogowanie kończy sesję", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Wyloguj" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
