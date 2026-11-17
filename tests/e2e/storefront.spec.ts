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
    await page.reload();
    await expect(page.locator(".cart-count")).toHaveText("1");
  });

  test("API odrzuca zamówienie z niepoprawnymi danymi", async ({ request }) => {
    const res = await request.post("/api/orders", { data: { email: "zly", items: [] } });
    expect(res.status()).toBe(400);
  });
});
