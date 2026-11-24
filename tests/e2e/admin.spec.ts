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
    // Wiele kamieni: nowy wpisany ręcznie + istniejący wybrany jednym dotknięciem
    await page.getByLabel("Kamienie", { exact: true }).fill("kwarc różowy");
    await page.getByRole("button", { name: "Dodaj", exact: true }).click();
    await page.getByRole("button", { name: "+ Perła naturalna" }).click();
    await expect(page.getByRole("list", { name: "Wybrane kamienie" })).toContainText("Kwarc różowy");
    await expect(page.getByRole("list", { name: "Wybrane kamienie" })).toContainText("Perła naturalna");
    // Galeria: 2 zdjęcia (pierwsze = główne); serwer przetwarza je do JPG
    await page.locator("#product-images-file").setInputFiles("tests/fixtures/hero.jpg");
    await expect(page.getByAltText("Zdjęcie 1")).toBeVisible({ timeout: 30_000 });
    await page.locator("#product-images-file").setInputFiles({ name: "broszka.png", mimeType: "image/png", buffer: PNG });
    await expect(page.getByAltText("Zdjęcie 2")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Dodaj produkt" }).click();
    await expect(page.getByText("Produkt został zapisany.")).toBeVisible();

    // Sklep pokazuje nowy produkt, cenę i nową kategorię; zdjęcie jest serwowane z /media
    await page.goto("/");
    const card = page.locator(".product-card").filter({ hasText: productName });
    await page.getByRole("tab", { name: categoryName }).click();
    await expect(card).toBeVisible();
    await expect(card).toContainText("249,50");
    await card.getByRole("button", { name: `Odkryj ${productName}` }).click();
    await expect(page.locator(".product-specs")).toContainText("Kwarc różowy, Perła naturalna");
    // Galeria w karcie produktu: 2 zdjęcia, kropki, przewinięcie do drugiego
    const gallery = page.locator(".product-detail-image .pd-gallery");
    await expect(gallery.locator(".pd-track img")).toHaveCount(2);
    await gallery.getByRole("button", { name: "Zdjęcie 2" }).click();
    await expect(gallery.getByRole("button", { name: "Zdjęcie 2" })).toHaveAttribute("aria-current", "true");
    await page.getByRole("button", { name: "Zamknij okno" }).click();
    const src = await card.locator("img").first().getAttribute("src");
    expect(src).toMatch(/^\/media\/[a-f0-9]{32}\.jpg$/);
    expect((await page.request.get(src!)).status()).toBe(200);

    // Ukrycie produktu w panelu usuwa go ze sklepu
    await page.goto(`/admin/produkty?q=${encodeURIComponent(productName)}`);
    await page.getByRole("button", { name: `Ukryj ${productName} w sklepie` }).click();
    await expect(page.getByRole("button", { name: `Pokaż ${productName} w sklepie` })).toBeVisible();
    await page.goto("/");
    await expect(page.locator(".product-card").filter({ hasText: productName })).toHaveCount(0);
  });

  test("strona główna: slajd HERO z filmem z galerii — wgranie, przetworzenie, odtwarzanie, usunięcie", async ({ page }, info) => {
    test.setTimeout(90_000);
    const title = `Film ${info.project.name}`;
    await login(page);
    await page.getByRole("navigation", { name: "Panel administracyjny" }).getByRole("link", { name: "Strona" }).click();
    await expect(page.getByRole("heading", { name: "Slajdy HERO" })).toBeVisible();
    await page.getByRole("link", { name: "+ Nowy" }).click();

    // Formularz mieści się w ekranie (długie nazwy produktów na liście nie mogą go rozpychać)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    // Zapis bez pliku → błąd przy polu
    await page.getByLabel("Tytuł", { exact: true }).fill(title);
    await page.getByRole("button", { name: "Dodaj slajd" }).click();
    await expect(page.getByText("Dodaj zdjęcie lub film.")).toBeVisible();
    await expect(page.getByLabel("Tytuł", { exact: true })).toHaveValue(title);

    // Film MOV (jak z iPhone'a) → serwer przerabia na MP4 + kadr startowy
    // Pionowy film 9:16 z dźwiękiem — jak nagrany telefonem
    await page.locator("#media-file").setInputFiles("tests/fixtures/hero-portrait.mov");
    await expect(page.getByLabel("Podgląd filmu")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Podgląd filmu")).toHaveAttribute("src", /^\/media\/[a-f0-9]{32}\.mp4$/);
    // Film ma dźwięk → opcja przycisku dźwięku, domyślnie włączona
    await expect(page.getByLabel(/Klient może włączyć dźwięk/)).toBeChecked();
    await page.getByLabel("Druga linia tytułu (kursywą)").fill("w ruchu.");
    await page.getByText("Lewa strona").click();
    await page.getByLabel("Kolejność").fill("99");
    await page.getByRole("button", { name: "Dodaj slajd" }).click();
    await expect(page.getByText("Slajd został zapisany")).toBeVisible();

    // Sklep: ostatni slajd odtwarza film; serwer obsługuje zapytania Range (wymagane przez Safari/iPhone)
    await page.goto("/");
    await page.locator(".slide-controls button").last().click();
    const video = page.locator("section.hero video.hero-image");
    await expect(video).toBeVisible();
    await expect(page.locator(".hero h1")).toContainText(title);
    const src = (await video.getAttribute("src"))!;
    // Pionowy film: na komputerze ramka na połowę szerokości, po prawej ~10% tła, boki płynnie zanikają
    await expect(page.locator("section.hero")).toHaveClass(/hero-portrait/);
    if (page.viewportSize()!.width >= 761) {
      const box = (await video.boundingBox())!, hero = (await page.locator("section.hero").boundingBox())!;
      expect(box.width / hero.width).toBeCloseTo(0.5, 1);
      expect((hero.x + hero.width - (box.x + box.width)) / hero.width).toBeCloseTo(0.1, 1);
      expect(await video.evaluate((v) => getComputedStyle(v).maskImage || getComputedStyle(v).webkitMaskImage)).toContain("linear-gradient");
    }
    expect(await video.getAttribute("poster")).toMatch(/^\/media\/[a-f0-9]{32}\.jpg$/);
    const partial = await page.request.get(src, { headers: { Range: "bytes=0-99" } });
    expect(partial.status()).toBe(206);
    expect((await partial.body()).length).toBe(100);
    // Film startuje wyciszony; przycisk włącza i wyłącza dźwięk
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    // Przycisk widoczny od razu (na telefonie leżał wcześniej pod paskiem przeglądarki) — sprawdzamy na pierwszym slajdzie widoku
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole("button", { name: "Włącz dźwięk filmu" })).toBeInViewport();
    // Film gra już chwilę; włączenie dźwięku zaczyna go od początku
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0.8);
    await page.getByRole("button", { name: "Włącz dźwięk filmu" }).click();
    expect(await video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeLessThan(0.6);
    await expect(page.getByRole("button", { name: "Wycisz film" })).toHaveAttribute("aria-pressed", "true");
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
    await page.getByRole("button", { name: "Wycisz film" }).click();
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    // Po zakończeniu filmu wchodzi następny slajd (nasz jest ostatni → wraca pierwszy)
    expect(await video.evaluate((v: HTMLVideoElement) => v.loop)).toBe(false);
    await expect(page.locator(".slide-number")).toHaveText("01", { timeout: 8000 });
    await expect(page.locator(".hero h1")).not.toContainText(title);

    // Usunięcie slajdu kasuje też plik
    await page.goto("/admin/strona");
    await page.getByRole("link", { name: new RegExp(title) }).click();
    await page.getByRole("button", { name: "Usuń slajd" }).click();
    await page.getByRole("button", { name: "Tak, usuń" }).click();
    await expect(page.getByText("Slajd został usunięty.")).toBeVisible();
    expect((await page.request.get(src)).status()).toBe(404);
  });

  test("slajd „Zimowa kolekcja” z wybranymi produktami → „Odkryj biżuterię” pokazuje tylko je", async ({ page }, info) => {
    test.setTimeout(90_000);
    const title = `Zimowa ${info.project.name}`;
    await login(page);
    await page.goto("/admin/strona/nowy");
    await page.locator("#media-file").setInputFiles("tests/fixtures/hero.jpg");
    await expect(page.getByAltText("Podgląd zdjęcia")).toBeVisible({ timeout: 30_000 });
    await page.getByLabel("Tytuł", { exact: true }).fill(title);
    await page.getByLabel("Druga linia tytułu (kursywą)").fill("kolekcja na długie, mroźne wieczory.");
    await page.getByLabel("„Odkryj biżuterię” prowadzi do").selectOption({ label: "★ Wybrane produkty (własna kolekcja)" });
    // Bez zaznaczenia — błąd przy liście
    await page.getByRole("button", { name: "Dodaj slajd" }).click();
    await expect(page.getByText("Zaznacz co najmniej jeden produkt kolekcji.")).toBeVisible();
    await page.getByLabel("Szukaj produktu…").or(page.locator("#picker-search")).first().fill("szepty");
    await page.getByLabel("Dodaj do kolekcji: Piaskowe szepty").check();
    await page.locator("#picker-search").fill("");
    await page.getByLabel("Dodaj do kolekcji: Kropla światła").check();
    await expect(page.locator(".adm-picker-head")).toContainText("Wybrano: 2");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await page.getByLabel("Kolejność").fill("98");
    await page.getByRole("button", { name: "Dodaj slajd" }).click();
    await expect(page.getByText("Slajd został zapisany")).toBeVisible();

    // Sklep: slajd → „Odkryj biżuterię” → tylko 2 produkty + etykieta kolekcji
    await page.goto("/");
    const controls = page.locator(".slide-controls button");
    for (let i = 0; i < await controls.count(); i++) {
      await controls.nth(i).click();
      if ((await page.locator(".hero h1").textContent())?.includes(title)) break;
    }
    await expect(page.locator(".hero h1")).toContainText(title);
    // Bez „produktu w rogu” — brak plakietki na zdjęciu; długi tytuł — każda linia w jednym wierszu, przyciski nie nachodzą na kreski
    await expect(page.locator(".hero-product-tag")).toHaveCount(0);
    // Każda linia osobno: mieści się w jednym wierszu (zmniejszona tylko, jeśli trzeba) albo — gdy musiałaby być
    // nieczytelnie mała (bardzo długi tekst na telefonie) — zawija się. Pierwsza, krótka linia zostaje w pełnym rozmiarze.
    const lines = await page.locator(".hero h1 .fit-line").evaluateAll((els) => els.map((l) => ({ wrap: l.classList.contains("is-wrapping"), oneRow: l.getBoundingClientRect().height < parseFloat(getComputedStyle(l).fontSize) * 1.6, size: parseFloat(getComputedStyle(l).fontSize) })));
    for (const l of lines) expect(l.wrap || l.oneRow).toBe(true);
    if (page.viewportSize()!.width > 760) expect(lines.every((l) => !l.wrap)).toBe(true);
    expect(lines[0].size).toBeGreaterThan(lines[1].size); // krótka pierwsza linia większa niż długa druga
    await page.waitForTimeout(700); // koniec animacji wejścia tekstu
    const [cta, ctl] = [await page.locator(".hero-cta").boundingBox(), await page.locator(".slide-controls").boundingBox()];
    expect(cta!.y + cta!.height <= ctl!.y || ctl!.y + ctl!.height <= cta!.y || cta!.x + cta!.width <= ctl!.x || ctl!.x + ctl!.width <= cta!.x).toBe(true);
    await page.locator(".hero-cta").getByRole("button", { name: /Odkryj biżuterię/ }).click();
    await expect(page.locator(".active-filters .collection-chip")).toContainText(`Kolekcja: ${title} kolekcja na długie, mroźne wieczory`);
    await expect(page.locator(".product-grid .product-name")).toHaveText(["Piaskowe szepty", "Kropla światła"]);
    await page.locator(".active-filters .collection-chip").click();
    expect(await page.locator(".product-grid .product-card").count()).toBeGreaterThan(2);

    // Sprzątanie: usuń slajd testowy
    await page.goto("/admin/strona");
    await page.getByRole("link", { name: new RegExp(title) }).click();
    await page.getByRole("button", { name: "Usuń slajd" }).click();
    await page.getByRole("button", { name: "Tak, usuń" }).click();
    await expect(page.getByText("Slajd został usunięty.")).toBeVisible();
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

  test("usuwanie zamówień: pojedyncze ze strony zamówienia i kilka naraz z listy", async ({ page, request }) => {
    const order = async () => {
      const res = await request.post("/api/orders", { data: { email: "test@example.pl", name: "Do usunięcia", phone: "600300400", street: "Testowa 1", postalCode: "00-001", city: "Warszawa", delivery: "pickup", consent: true, items: [{ id: "pierscionek-perla", quantity: 1 }] } });
      expect(res.status()).toBe(201);
      return (await res.json()).number as string;
    };
    const [first, second, third] = [await order(), await order(), await order()];
    await login(page);

    // Pojedyncze — ze strony zamówienia, z potwierdzeniem i informacją o zwrocie na stan
    await page.goto("/admin/zamowienia");
    await page.getByRole("link", { name: new RegExp(first) }).click();
    await page.getByRole("button", { name: "Usuń zamówienie" }).click();
    await expect(page.locator(".adm-danger-confirm")).toContainText("wrócą na stan");
    await page.getByRole("button", { name: "Tak, usuń" }).click();
    await expect(page.getByText("Usunięto zamówienia: 1.")).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(first) })).toHaveCount(0);

    // Kilka naraz — zaznaczenie na liście
    await page.getByLabel(`Zaznacz zamówienie ${second}`).check();
    await page.getByLabel(`Zaznacz zamówienie ${third}`).check();
    await expect(page.getByRole("region", { name: /zaznaczonych zamówieniach/ })).toContainText("Zaznaczono: 2");
    await page.getByRole("button", { name: "Usuń zaznaczone" }).click();
    await page.getByRole("button", { name: "Tak, usuń" }).click();
    await expect(page.getByText("Usunięto zamówienia: 2.")).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(`${second}|${third}`) })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  });

  test("wylogowanie kończy sesję", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Wyloguj" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
