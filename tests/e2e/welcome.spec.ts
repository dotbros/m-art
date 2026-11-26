import { expect, test } from "@playwright/test";

test.describe("Powitanie właścicielki (/witaj)", () => {
  test("teksty, link do sklepu, ukryta przed wyszukiwarkami, bez przewijania w bok", async ({ page }) => {
    await page.goto("/witaj");
    await expect(page).toHaveTitle("Witaj w M.art");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Teraz jesteś częścią");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("czegoś większego");
    await expect(page.getByText(/ten prezent pozwoli Ci jeszcze bardziej się zrealizować/)).toBeVisible();
    await expect(page.getByText(/Wewnątrz ramki znajdziesz klucz/)).toBeVisible();
    const cta = page.getByRole("link", { name: "Wejdź do swojego sklepu" });
    // Przycisk pojawia się „za dotknięciem różdżki” dopiero po przewinięciu do końca
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator(".w-magic")).toHaveAttribute("data-shown", "true");
    await expect(cta).toBeVisible();
    await expect.poll(() => cta.evaluate((e) => getComputedStyle(e).opacity), { timeout: 5000 }).toBe("1");
    // Napis przycisku w jednej linii
    expect((await cta.boundingBox())!.height).toBeLessThanOrEqual(60);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await cta.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
