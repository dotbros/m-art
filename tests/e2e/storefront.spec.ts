import { expect, test } from "@playwright/test";

test.describe("Sklep — klient na telefonie i komputerze", () => {
  test("strona główna ładuje produkty z bazy i nie ma poziomego przewijania", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Z natury");
    await expect(page.locator(".product-card").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("filtr kategorii pokazuje tylko wybrane produkty", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Kolczyki" }).click();
    const names = await page.locator(".product-card .product-name").allTextContents();
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain("Piaskowe szepty");
    expect(names).not.toContain("Słoneczny splot");
  });

  test("pełna ścieżka zakupu: produkt → koszyk → zamówienie", async ({ page }) => {
    await page.goto("/");
    await page.locator(".product-card").filter({ hasText: "Leśna harmonia" }).getByRole("button", { name: "Odkryj Leśna harmonia" }).click();
    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("heading", { name: "Leśna harmonia" })).toBeVisible();
    await expect(modal).toContainText("Agat mszysty");
    await modal.getByRole("button", { name: /Dodaj do koszyka/ }).click();

    const cart = page.getByRole("dialog", { name: /Twój koszyk/ });
    await expect(cart).toContainText("Leśna harmonia");
    await expect(cart).toContainText("Do darmowej dostawy brakuje");
    await cart.getByRole("button", { name: /Przejdź do zamówienia/ }).click();

    const checkout = page.getByRole("dialog", { name: "Twoje zamówienie" });
    await checkout.getByLabel("Imię i nazwisko").fill("Anna Testowa");
    await checkout.getByLabel("Adres e-mail").fill("anna@example.pl");
    await checkout.getByLabel("Numer telefonu").fill("600 100 200");
    await checkout.getByLabel("Ulica, numer domu i mieszkania").fill("Kwiatowa 12/4");
    await checkout.getByLabel("Kod pocztowy").fill("00-001");
    await checkout.getByLabel("Miejscowość").fill("Warszawa");
    await checkout.getByRole("checkbox").check();
    await expect(checkout.locator(".summary-line.total")).toContainText("133,90");
    await checkout.getByRole("button", { name: /Złóż zamówienie/ }).click();
    await expect(checkout.locator(".order-number strong")).toHaveText(/^MA-\d{8}-[A-F0-9]{6}$/);
  });

  test("koszyk przetrwa odświeżenie strony", async ({ page }) => {
    await page.goto("/");
    await page.locator(".product-card").first().getByRole("button", { name: /Dodaj .* do koszyka/ }).click();
    await expect(page.locator(".cart-count")).toHaveText("1"); // zapis do pamięci przeglądarki następuje po aktualizacji koszyka
    await page.reload();
    await expect(page.locator(".cart-count")).toHaveText("1");
  });

  test("gest/przycisk „wstecz” zamyka okno zamiast opuszczać sklep", async ({ page }) => {
    await page.goto("/");
    await page.locator(".product-card .product-image-button").first().click();
    await expect(page.locator(".product-modal")).toBeVisible();
    await page.goBack();
    await expect(page.locator(".product-modal")).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    // Produkt → koszyk to nadal JEDEN krok „wstecz”
    await page.locator(".product-card .product-image-button").first().click();
    await page.locator(".product-modal").getByRole("button", { name: /Dodaj do koszyka/ }).click();
    await expect(page.getByRole("dialog", { name: /Twój koszyk/ })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".product-card").first()).toBeVisible();
    // Zamknięcie krzyżykiem nie zostawia „pustego” wpisu w historii
    await page.getByRole("button", { name: "Otwórz menu" }).or(page.getByRole("button", { name: /^Koszyk/ })).first().click();
    await page.getByRole("button", { name: "Zamknij okno" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("przeciągnięcie okna w dół zamyka je (telefon)", async ({ page, browserName }, info) => {
    test.skip(!info.project.name.startsWith("mobile") || browserName !== "chromium", "Symulacja dotyku działa w Chromium na profilach mobilnych");
    await page.goto("/");
    await page.locator(".product-card .product-image-button").first().click();
    const sheet = page.locator(".product-modal");
    await expect(sheet).toBeVisible();
    await sheet.evaluate((el) => {
      const touch = (y: number) => new Touch({ identifier: 1, target: el, clientX: 200, clientY: y });
      el.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [touch(150)], changedTouches: [touch(150)] }));
      for (const y of [190, 260, 340, 420]) el.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, touches: [touch(y)], changedTouches: [touch(y)] }));
      el.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [touch(420)] }));
    });
    await expect(sheet).toHaveCount(0);
  });

  test("przesunięcie palcem w bok zmienia slajd HERO (w kółko), krawędź ekranu zostaje dla gestu „wstecz”", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Symulacja dotyku działa w Chromium");
    await page.goto("/");
    const hero = page.locator("section.hero");
    const title = page.locator(".hero h1");
    const swipe = (fromX: number, toX: number) => hero.evaluate((el, [a, b]) => {
      const touch = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 });
      el.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [touch(a)], changedTouches: [touch(a)] }));
      el.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, touches: [touch(b)], changedTouches: [touch(b)] }));
      el.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [touch(b)] }));
    }, [fromX, toX]);
    const first = await title.textContent();
    await swipe(300, 120); // w lewo → następny
    await expect(title).not.toHaveText(first!);
    await expect(page.locator(".slide-number")).toHaveText("02");
    await swipe(120, 300); // w prawo → poprzedni
    await expect(page.locator(".slide-number")).toHaveText("01");
    await swipe(120, 300); // z pierwszego w prawo → ostatni
    await expect(page.locator(".slide-number")).toHaveText(await page.locator(".slide-total").textContent() as string);
    await swipe(10, 250); // start przy krawędzi = gest systemowy, slajd bez zmian
    await expect(page.locator(".slide-number")).toHaveText(await page.locator(".slide-total").textContent() as string);
  });

  test("API odrzuca zamówienie z niepoprawnymi danymi", async ({ request }) => {
    const res = await request.post("/api/orders", { data: { email: "zly", items: [] } });
    expect(res.status()).toBe(400);
  });
});
