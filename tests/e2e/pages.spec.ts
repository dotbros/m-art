import { expect, test, type Page } from "@playwright/test";

const noHorizontalScroll = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

test.describe("Podstrony: pracownia i pielęgnacja", () => {
  test("strona główna → „Zajrzyj do świata M.art” → /pracownia; stopka → /pielegnacja ze śródtytułami", async ({ page }) => {
    await page.goto("/");
    const story = page.locator("#pracownia");
    await expect(story.getByRole("heading", { level: 2 })).toContainText("Nie z fabryki.");
    // Zdjęcie: ten sam format 4:5 na każdym urządzeniu i link do podstrony
    const photo = story.locator(".story-photo");
    const box = (await photo.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(0.8, 2);
    await expect(photo).toHaveAttribute("href", "/pracownia");
    await story.getByRole("link", { name: /Zajrzyj do świata M\.art/ }).click();
    await expect(page).toHaveURL(/\/pracownia$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Nie z fabryki.");
    await expect(page.locator(".content-intro")).not.toBeEmpty(); // treść mogła zmienić inny test panelu
    await expect(page.locator(".content-hero img")).toBeVisible();
    await noHorizontalScroll(page);

    await page.goto("/");
    await page.locator(".site-footer").getByRole("link", { name: "Pielęgnacja biżuterii" }).click();
    await expect(page).toHaveURL(/\/pielegnacja$/);
    await expect(page.getByRole("heading", { level: 2, name: "Miękko i osobno" })).toBeVisible();
    await noHorizontalScroll(page);
  });

  test("telefon: większe ikony w nagłówku i krótkie etykiety filtrów", async ({ page }, info) => {
    test.skip(!info.project.name.startsWith("mobile"), "Dotyczy wersji mobilnej");
    await page.goto("/");
    const size = await page.locator(".mobile-header-actions svg").first().evaluate((s) => s.getBoundingClientRect().width);
    expect(size).toBeGreaterThanOrEqual(25);
    // Przyciski HERO w jednej linii, bez uciętego tekstu
    const [a, b] = [await page.locator(".hero-cta>.button").boundingBox(), await page.locator(".hero-story-link").boundingBox()];
    expect(Math.abs(a!.y - b!.y)).toBeLessThan(2);
    expect(await page.locator(".hero-story-link").evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    await page.getByRole("button", { name: /Filtruj/ }).click();
    await expect(page.getByLabel("Twój kamień").locator("option").first()).toHaveText("Wszystkie");
    await expect(page.getByLabel("Sortuj według").locator("option").first()).toHaveText("Polecane");
  });
});

test.describe("Podstrony — panel", () => {
  test("pracownia: zajawka z osobnym zdjęciem, zdjęcie nagłówkowe + galeria, zmiana wstępu", async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill("e2e@mart.local");
    await page.getByLabel("Hasło").fill("E2eHaslo12345");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page.getByRole("heading", { name: /Witaj/ })).toBeVisible();

    await page.goto("/admin/strona");
    await page.getByRole("link", { name: /Poznaj naszą pracownię/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Poznaj naszą pracownię" })).toBeVisible();
    await noHorizontalScroll(page);

    // Osobne zdjęcie zajawki na stronę główną
    await page.locator("#teaser-file").setInputFiles("tests/fixtures/hero.jpg");
    await expect(page.locator(".adm-media").first().locator("img")).toHaveAttribute("src", /^\/media\//, { timeout: 30_000 });
    // Zdjęcia podstrony: zostaw tylko pierwsze (nagłówek) — usuń galerię z poprzednich przebiegów — i dodaj 2 do galerii
    while (await page.locator(".adm-gallery li").count() > 1) {
      const n = await page.locator(".adm-gallery li").count();
      await page.getByRole("button", { name: `Usuń zdjęcie ${n}` }).click();
    }
    for (const n of [2, 3]) {
      await page.locator("#page-images-file").setInputFiles("tests/fixtures/hero.jpg");
      await expect(page.getByAltText(`Zdjęcie ${n}`)).toBeVisible({ timeout: 30_000 });
    }
    const intro = `Wstęp testowy ${info.project.name}`;
    await page.getByLabel("Wstęp").fill(intro);
    await page.getByRole("button", { name: "Zapisz", exact: true }).click();
    await expect(page.getByText("Podstrona została zapisana")).toBeVisible();

    // Strona główna: zdjęcie zajawki z /media
    await page.goto("/");
    await expect(page.locator("#pracownia .story-photo img")).toHaveAttribute("src", /^\/media\/[a-f0-9]{32}\.jpg$/);
    // Podstrona: nowy wstęp, nagłówek = pierwsze zdjęcie, galeria = pozostałe 2, powiększenie
    await page.goto("/pracownia");
    await expect(page.locator(".content-intro")).toHaveText(intro);
    await expect(page.locator(".content-hero img")).toHaveAttribute("src", "/images/atelier.svg");
    await expect(page.locator(".page-gallery li")).toHaveCount(2);
    await page.getByRole("button", { name: "Powiększ zdjęcie 1 z 2" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Następne zdjęcie" }).click();
    await expect(page.getByRole("dialog")).toHaveAttribute("aria-label", "Zdjęcie 2 z 2");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await noHorizontalScroll(page);
  });

  test("kamienie: pola wyboru w sekcji „Wyświetlanie” mają równy rozmiar", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("E-mail").fill("e2e@mart.local");
    await page.getByLabel("Hasło").fill("E2eHaslo12345");
    await page.getByRole("button", { name: "Zaloguj się" }).click();
    await expect(page.getByRole("heading", { name: /Witaj/ })).toBeVisible();
    await page.goto("/admin/kamienie/nowy");
    await expect(page.locator(".adm-switch input")).toHaveCount(2);
    const sizes = await page.locator(".adm-switch input").evaluateAll((els) => els.map((e) => `${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
    expect(sizes).toEqual(["24x24", "24x24"]);
  });
});
