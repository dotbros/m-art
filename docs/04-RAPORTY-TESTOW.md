# Raporty testów

Po każdym etapie uruchamiamy **wszystkie** testy dotychczasowych modułów: `npm run test:all`.

| Poziom | Narzędzie | Gdzie | Co sprawdza |
|---|---|---|---|
| Statyczny | TypeScript, ESLint | `npm run typecheck`, `npm run lint` | typy, jakość kodu, reguły Next.js/React |
| Jednostkowe | Vitest | `tests/unit` | walidacja, ceny, dostawa, slug, hasła, limit logowania, upload |
| Integracyjne | Vitest + PGlite w pamięci | `tests/integration` | migracje, seed, zapytania sklepu, zamówienia i stany, sesje admina |
| E2E | Playwright na buildzie produkcyjnym | `tests/e2e` | pełne ścieżki w przeglądarce: **Pixel 7 (Chrome)**, **iPhone 14 (Safari/WebKit)**, desktop 1366 px |

---

## T-001 · 2026-11-17 · po etapach 0–3

**Środowisko:** Windows 11, Node.js 20.20.2, Next.js 16.4.6, PGlite 0.5.16, Playwright 1.65.1 (Chromium + WebKit).

| Zestaw | Wynik | Czas |
|---|---|---|
| `typecheck` | ✅ 0 błędów | — |
| `lint` | ✅ 0 błędów, 10 ostrzeżeń¹ | — |
| Vitest — 5 plików | ✅ **34 / 34** | 1,7 s |
| Playwright — 12 scenariuszy × 3 urządzenia | ✅ **36 / 36** | 38,5 s |
| **Łącznie** | ✅ **70 / 70 testów** | ~48 s |

¹ `@next/next/no-img-element` — zwykłe `<img>` przejęte ze wzoru oraz podglądy w panelu. Do zamiany na `next/image` w etapie 5 (optymalizacja zdjęć).

### Testy jednostkowe (20)
- **catalog** (5): format kwot, koszt dostawy (próg 299 zł, odbiór), slug z polskich znaków, wybór bazy PGlite/PostgreSQL.
- **validation** (10): poprawne zamówienie, błędny kod/e-mail/zgoda, sumowanie pozycji i limit 10 szt., pusty koszyk / ilości ujemne i ułamkowe / zła dostawa, parser cen (przecinek, kropka, spacje), błędne ceny, kategoria (slug), produkt (wymagane pola, cena przed obniżką, poprawny produkt).
- **security** (5): hash scrypt z solą i weryfikacja, min. długość hasła, blokada po 5 próbach i odblokowanie po 15 min, wykrywanie typu zdjęcia po zawartości (odrzuca SVG i PHP), nazwy plików `/media` (odrzuca `../`).

### Testy integracyjne (14)
- **shop-db** (9): migracje + seed (5 kategorii, 8 produktów), seed nie nadpisuje danych, sklep sortuje i dołącza kategorię, ukryte produkty i kategorie niewidoczne, zamówienie liczy kwoty z bazy i zdejmuje stan, dopłata za kuriera / odbiór gratis, **odrzucenie ponad stan bez zapisu (transakcja)**, odrzucenie nieistniejących/ukrytych produktów, historia zamówienia po usunięciu produktu.
- **auth-db** (5): logowanie (wielkość liter e-maila), złe hasło i nieistniejące konto, zmiana hasła przez `admin:create`, w bazie tylko skrót tokena, odrzucenie tokenu fałszywego/wygasłego/usuniętego.

### Testy E2E (12 scenariuszy na każdym urządzeniu)
**Sklep:** strona startowa bez poziomego przewijania · filtr kategorii · **pełny zakup: produkt → koszyk → formularz → numer zamówienia** (kwota 133,90 zł z dostawą) · koszyk po odświeżeniu · API odrzuca złe dane.
**Panel:** przekierowanie bez logowania · złe hasło · nawigacja i brak przewijania w bok · **utworzenie kategorii i produktu ze zdjęciem** (z błędem walidacji i zachowaniem wpisanych danych) → produkt widoczny w sklepie, zdjęcie serwowane z `/media` → ukrycie usuwa go ze sklepu · blokada usunięcia kategorii z produktami · zmiana statusu zamówienia i numer przesyłki · wylogowanie kończy sesję.

### Błędy wykryte przez testy w tym etapie
1. **Utrata danych formularza po błędzie walidacji** (React 19 resetuje formularz po akcji) — naprawione, pokryte testem.
2. Selektory testów kolidowały z `#__next-route-announcer__` (role=alert) — poprawiono testy.
3. Regresja układu (pole pliku poza ekranem) — naprawione, dodana asercja.

### Zrzuty ekranów (iPhone 14)
`docs/zrzuty/01…09` — generowane skryptem `npx tsx scripts/screenshots.mts http://localhost:3100 ./docs/zrzuty` (przy działającym serwerze).

---

## T-002 · 2026-11-18 · po poprawkach z testów na telefonie

| Zestaw | Wynik |
|---|---|
| `typecheck` | ✅ 0 błędów |
| `lint` | ✅ 0 błędów (ostrzeżenia `<img>` jak w T-001) |
| Vitest — 5 plików | ✅ **38 / 38** (+4: `parseStones`, produkt z wieloma/bez kamieni, limit 10, filtr po każdym kamieniu) |
| Playwright — 14 scenariuszy × 3 urządzenia | ✅ **40 / 40**, 2 pominięte¹ |

Nowe scenariusze E2E:
- **gest „wstecz” zamyka okno** (produkt; produkt → koszyk = jeden krok wstecz; zamknięcie krzyżykiem nie zostawia wpisu w historii) — Android, iPhone, desktop,
- **przeciągnięcie okna w dół zamyka je** — Android¹,
- panel: **wybór wielu kamieni** (nowy wpisany + istniejący jednym dotknięciem) i ich wyświetlenie w karcie produktu w sklepie.

Dodatkowo zweryfikowano ręcznie (automatyczny skrypt przez adres `http://192.168.1.96:3200`, profil iPhone 14): menu i karta produktu otwierają się, brak błędów w konsoli, logo wczytane.

¹ Symulacja dotyku (TouchEvent) działa tylko w Chromium — na profilach iPhone (WebKit) i desktop test jest pomijany; wymaga sprawdzenia ręcznego na iPhonie.
