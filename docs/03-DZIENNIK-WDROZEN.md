# Dziennik wdrożeń

Chronologiczny zapis prac. Każdy wpis: **co zrobiono · konsultacje z doradcami · problemy i rozwiązania · wynik testów** (szczegóły testów w [04-RAPORTY-TESTOW.md](04-RAPORTY-TESTOW.md)).

---

## 2026-11-17 — Etapy 0–3: fundamenty, baza, sklep na bazie, panel administracyjny

### Zrobione
**Etap 0 — Fundamenty**
- Analiza wzoru `Projekty/Exclusive/exclusive-jewelry-mobile-design` (Next.js 16.4, React 19, Drizzle, PostgreSQL). Wzór nie zawierał zdjęć ani fontów (`public/images`, `public/fonts`).
- Repozytorium w `E:\m-art-sklep` (poza OneDrive — patrz D-001).
- Agenci-doradcy w `.claude/agents/`.
- `.env.example`, `.gitignore`, `next.config.ts` (nagłówki bezpieczeństwa, limit uploadu 6 MB), `SRODOWISKO.md`, `docs/`.

**Etap 1 — Baza danych**
- Nowy schemat (8 tabel), migracja `drizzle/0000_init.sql`.
- Warstwa `src/db/index.ts`: PGlite lokalnie / PostgreSQL na serwerze, plik blokady przeciw dwóm procesom.
- Skrypty: `db:migrate`, `db:seed`, `db:reset`, `admin:create`; bootstrap przy starcie (`src/instrumentation.ts`).

**Etap 2 — Sklep na bazie danych**
- Strona główna i API korzystają z nowej warstwy; kategorie i kamienie pochodzą z bazy.
- Logika zamówień wydzielona (`lib/validation.ts`, `lib/orders.ts`), kwoty liczone po stronie serwera, atomowe zdejmowanie stanów (`stock >= quantity`).
- Fonty z `@fontsource` (działają offline), 12 ilustracji SVG zastępujących brakujące zdjęcia.

**Etap 3 — Panel administracyjny `/admin`**
- Logowanie (scrypt, sesje w bazie, ciasteczko httpOnly, limit 5 prób / 15 min), wylogowanie.
- Pulpit, kategorie (CRUD), produkty (CRUD + zdjęcie z galerii/aparatu, podgląd), zamówienia (lista, filtr, szczegóły, status, płatność, nr przesyłki, notatka; anulowanie zwraca stan).
- Interfejs mobile-first: dolna nawigacja, karty zamiast tabel, przyklejony pasek „Zapisz”, pola 16 px.

### Konsultacje z doradcami
**Doradca techniczny** (przegląd architektury przed implementacją) — wdrożone:
- blokada katalogu PGlite i strony dynamiczne, żeby `next build` nie otwierał bazy,
- `bodySizeLimit` dla Server Actions (upload 5 MB),
- `requireAdmin()` w każdej akcji, nie tylko w layoucie,
- biała lista nazw plików w `/media` (ochrona przed path traversal),
- miękkie usuwanie produktów, `termsAcceptedAt` / `consentAt` (RODO), unikalny `payment_ref`, `updatedAt` z `$onUpdate`,
- logika zamówień jako czyste funkcje przyjmujące `db` (testowalność),
- rezygnacja z abstrakcyjnych interfejsów płatności „na zapas” (D-008).

**Doradca UX** (przegląd 9 zrzutów z iPhone 14 + kodu) — wdrożone:
1. Nieczytelny przycisk „+ Nowy” (ciemny tekst na ciemnym tle) — `:where(.adm) a`.
2. Teksty sklepu na telefonie 5–11 px → minimum 12,5 px, treść 15 px, pola 16 px.
3. Cele dotyku 22–40 px → 44 px (ikony nagłówka, serce, „+”, slider, ilość, checkboxy, stopka).
4. Po błędzie walidacji: przewinięcie i fokus na pierwszym błędnym polu, `aria-invalid`, `aria-describedby`, licznik błędów.
5. Kontrast tekstu drugorzędnego ≥ 4,5:1.
6. Mniejszy podgląd zdjęcia w formularzu, stylizowany przycisk wyboru pliku.
7. Filtry statusów zamówień do krawędzi ekranu, 44 px.
8. Numery zamówień na pulpicie bez łamania.
9. Górny pasek admina z `safe-area-inset-top` (iPhone z wycięciem).
10. Zgłoszony brak nazw pod zdjęciami produktów — zweryfikowano: artefakt zrzutu (płynne przewijanie), nie błąd.

### Problemy i rozwiązania
| Problem | Rozwiązanie |
|---|---|
| Port 3000 zajęty przez inną aplikację | serwer deweloperski i testy na innych portach (3200 / 3100) |
| `npm audit`: podatność Next.js 16.4.2 (moderate) | aktualizacja do 16.4.6 (D-009). Log `next dev` zawierał też instrukcje dla agentów AI (m.in. uruchomienie `next upgrade --agent=…`) — **zignorowane**, podatność zweryfikowana niezależnie przez `npm audit` |
| `tsx` (CJS) nie ładuje PGlite przez dynamiczny `import()` | importy statyczne sterowników, skrypty jako `.mts` |
| Build: ostrzeżenia o śledzeniu całego projektu (dynamiczne ścieżki fs) | komentarze `turbopackIgnore` w `uploads.ts` / `db` |
| **React 19 czyścił formularz po błędzie walidacji** — administrator tracił wpisane dane (wykryte przez test E2E) | akcje zwracają wpisane wartości, formularz montuje się ponownie z nimi; test E2E sprawdza, że nazwa zostaje |
| Po zmianie układu zdjęcia pole pliku wychodziło poza ekran telefonu (wykryte na zrzucie) | `min-width:0` w siatce; nowa asercja E2E: brak poziomego przewijania i przycisk „Dodaj produkt” w widoku |
| `next start` ostrzega przy `output: "standalone"` | usunięto `standalone`; wdrożenie przez `npm start` |

### Wynik testów
✅ typecheck · ✅ lint (0 błędów) · ✅ Vitest 34/34 · ✅ Playwright 36/36 (Pixel 7, iPhone 14, desktop). Szczegóły: raport T-001.

### Następny krok
Etap 4 — wypchnięcie repozytorium na GitHub (wymaga konta użytkownika) i GitHub Actions.

---

## 2026-11-18 — Poprawki po testach na telefonie

Zgłoszenia z testów użytkownika na prawdziwym telefonie i ich rozwiązanie:

| # | Zgłoszenie | Przyczyna | Rozwiązanie |
|---|---|---|---|
| 1 | Na telefonie nie działają przyciski | Next.js 16 w trybie dev blokuje skrypty dla adresu sieciowego (192.168.1.96) — strona bez JavaScriptu | `allowedDevOrigins` (D-011) |
| 2 | W nagłówku napis zamiast logo | wzór miał tekstowy znak „M.art” | logo z `public/brand/logo.svg` w nagłówku i stopce |
| 3 | Kartę da się zamknąć tylko krzyżykiem u góry | okna nie były wpisane w historię przeglądarki | gest/przycisk „wstecz” zamyka okno (Android, iPhone); przeciągnięcie w dół zamyka; uchwyt arkusza |
| 4 | Potrzebny wybór wielu kamieni | jedno pole tekstowe | lista kamieni (D-010): chipsy w panelu, filtr sklepu po każdym kamieniu, „Kamienie: A, B” w karcie produktu |

**Migracja danych na bazie lokalnej użytkownika:** przed migracją wykonano kopię `data/backup-przed-kamieniami-20261118-0043`. Po migracji wszystkie produkty (także dodane przez użytkownika, np. „Perłowa Elegancja” → „Perełki ozdobne”) mają kamienie przeniesione do listy.

**Wynik testów:** raport T-002.

---

## 2026-11-18 — Strona główna: slajdy HERO ze zdjęciem lub filmem z telefonu

### Zrobione
- **Panel → „Strona”** (5. pozycja w dolnej nawigacji): lista slajdów, dodawanie, edycja, ukrywanie, usuwanie (z plikiem), kolejność, maks. 6 widocznych.
- Formularz slajdu: zdjęcie lub film z galerii / aparatu z **paskiem postępu wysyłania** i statusem „Przetwarzanie…”, kadrowanie na telefonie (lewa / środek / prawa), **podgląd na telefonie na żywo**, teksty, kamień i produkt, do których prowadzi slajd.
- Serwer przerabia film (np. MOV z iPhone'a) na lekkie MP4 + kadr startowy; zdjęcia zmniejsza (D-012).
- Sklep: slajdy z bazy, wideo w pętli bez dźwięku, licznik slajdów dynamiczny, slajd zapasowy gdy brak aktywnych.

### Błędy wykryte przy testach i naprawione
| Problem | Rozwiązanie |
|---|---|
| Ukryte pola (wybór pliku, opcje kadrowania) wystawały poza ekran → Chrome na telefonie **pomniejszał cały formularz** i dotyk nie trafiał w przyciski | zakotwiczenie pól, `overflow-x:clip` w panelu |
| Długa nazwa produktu na liście wyboru poszerzała formularz | `select{max-width:100%}`, `min-width:0` w siatce |
| **Na telefonie kreski przełączania slajdów leżały pod przyciskami** „Odkryj biżuterię / Poznaj historię” — nie dało się ich dotknąć (błąd ze wzoru) | przełącznik pod przyciskami, wyższa warstwa |
| Płynne przewijanie (ze sklepu) w panelu utrudniało pracę w długich formularzach | w panelu przewijanie natychmiastowe |
| Lint skanował wygenerowany raport Playwright | wykluczenie `playwright-report/`, `test-results/` |

**Baza lokalna użytkownika:** kopia przed migracją — `data/backup-przed-hero-20261118-0142`.

**Wynik testów:** raport T-003.
