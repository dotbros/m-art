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

---

## T-003 · 2026-11-18 · slajdy HERO (zdjęcie / film)

| Zestaw | Wynik |
|---|---|
| `typecheck` | ✅ 0 błędów |
| `lint` | ✅ 0 błędów |
| Vitest — 7 plików | ✅ **50 / 50** (+12) |
| Playwright — 15 scenariuszy × 3 urządzenia | ✅ **43 / 43**, 2 pominięte (przeciąganie palcem poza Chromium) |

Nowe testy:
- **jednostkowe:** rozpoznawanie zdjęć (JPG/PNG/WEBP/HEIC) i filmów (MP4/MOV/WEBM) po zawartości, odrzucanie SVG/PDF/skryptów; walidacja slajdu (wymagany tytuł i plik, obce adresy i `../` odrzucane, typ pliku zgodny z rodzajem, poster tylko dla filmu).
- **integracyjne:** **prawdziwa konwersja ffmpeg** — MOV → MP4 (`ftyp`) + kadr JPG, zdjęcie → JPG, odrzucenie filmu tam, gdzie dozwolone tylko zdjęcia, pliku-skryptu i pustego pliku; migracja dodaje 3 slajdy ze wzoru; ukryte slajdy nie trafiają na stronę, kolejność.
- **E2E (Android, iPhone, desktop):** panel → „Strona” → nowy slajd: brak przewijania w bok, błąd „Dodaj zdjęcie lub film” z zachowaniem tytułu, **wgranie filmu MOV → podgląd MP4**, kadrowanie, zapis → strona główna: przełączenie na slajd, **film odtwarzany z kadrem startowym**, `Range: bytes=0-99` → **206** i 100 bajtów (wymóg Safari), usunięcie slajdu kasuje plik (404).

Wykryte dzięki testom: pomniejszanie formularza na telefonie przez wystające ukryte pola, niedotykalny przełącznik slajdów na telefonie (ze wzoru), wyścig w teście koszyka.

---

## T-004 · 2026-11-20 · kamienie naturalne

| Zestaw | Wynik |
|---|---|
| `typecheck` | ✅ 0 błędów |
| `lint` | ✅ 0 błędów |
| Vitest — 8 plików | ✅ **63 / 63** (+9) |
| Playwright — 18 scenariuszy × 3 urządzenia | ✅ **54 / 54**, 3 pominięte (gesty dotyku poza Chromium) |

Nowe testy:
- **jednostkowe:** walidacja kamienia (adres z nazwy, wielka litera, duplikaty zdjęć, obce adresy zdjęć, limit 8 zdjęć, długość podpisu).
- **integracyjne:** dane startowe (3 opisane kamienie na stronie głównej, wszystkie kamienie z produktów w słowniku), strona kamienia (tylko widoczne produkty z kamieniem; ukryty kamień = brak strony), `ensureStones` bez duplikatów, zmiana nazwy aktualizuje produkty i slajdy HERO, wzór adresu z migracji 0006 (polskie znaki).
- **E2E (Android, iPhone, desktop):** strona główna → karta „Jaspis cesarski” → strona kamienia (tytuł strony, podpis, opis, tylko produkty z jaspisem, brak przewijania w bok) → produkt otwiera się w sklepie; lista /kamienie, 404 dla nieistniejącego; panel: nowy kamień ze zdjęciem i opisem → przypisanie do produktu podpowiedzią → strona kamienia (zdjęcie z /media, 2 akapity, produkt) → karta na stronie głównej → blokada usunięcia kamienia w produkcie.
---

## T-005 · 2026-11-24 · poprawki mobilne, nieskończona karuzela, podstrony

| Zestaw | Wynik |
|---|---|
| `typecheck` / `lint` | ✅ 0 błędów |
| Vitest — 10 plików | ✅ **69 / 69** |
| Playwright — 3 urządzenia | ✅ **77 / 77**, 4 pominięte (gesty dotyku poza Chromium; test ikon tylko na telefonach) |

Nowe: format treści (akapity, śródtytuły), walidacja podstrony, treści z migracji 0007; E2E — strona główna → /pracownia, stopka → /pielegnacja; panel: zajawka z osobnym zdjęciem, zdjęcie nagłówkowe + 2 w galerii, powiększenie i przewijanie galerii; karuzela kamieni w pętli (wstecz z pierwszego → ostatni, dalej z ostatniego → pierwszy; kopie niewidoczne dla czytników); ikony nagłówka ≥ 25 px i krótkie etykiety filtrów na telefonach; równe pola wyboru w panelu.
Błędy testów poprawione w trakcie: zależność od kolejności urządzeń (wspólna baza testowa), przejście do formularza przed końcem logowania, liczenie linków poza karuzelą.

---

## T-006 · 2026-11-25 · przejście na MariaDB 10.11 (D-018)

| Zestaw | Wynik |
|---|---|
| `typecheck` | ✅ 0 błędów |
| Vitest — 10 plików (na lokalnej MariaDB, osobna baza na plik) | ✅ **76 / 76** |
| Playwright — 3 urządzenia (build produkcyjny na bazie `mart_e2e`) | ✅ **83 / 83**, 4 pominięte (gesty dotyku poza Chromium; testy tylko dla telefonu) |

Zmienione/nowe testy: konfiguracja bazy (adres mysql:// i mariadb://, czytelny błąd bez `DATABASE_URL`, hasło ze znakami specjalnymi, gniazdo UNIX hostingu); lista kamieni w JSON (tylko pełna nazwa, polskie znaki i półpauza zachowane po zapisie i odczycie) — zamiast testu funkcji SQL z PostgreSQL.
Błąd wykryty przez testy w trakcie: brak treści startowych podstron i slajdów (w PostgreSQL wstawiały je migracje 0003/0007) → migracja `0001_tresci_startowe`.
Przeniesienie danych: 5 kategorii, 9 produktów, 11 kamieni, 2 podstrony, 2 slajdy, konto admina — sprawdzone zapytaniem (listy kamieni i zdjęć, daty).