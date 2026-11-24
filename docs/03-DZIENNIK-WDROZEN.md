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

### 2026-11-18 — HERO: przesuwanie palcem
- Przesunięcie palcem w lewo/prawo zmienia slajd (w kółko); pionowy ruch przewija stronę (`touch-action: pan-y`).
- Gest zaczęty w pasie 24 px przy lewej krawędzi jest ignorowany — to systemowy „wstecz” (iPhone, Android).
- Łagodne przejście obrazu przy zmianie slajdu; wyłączone przy „ogranicz ruch”.
- Test E2E: następny / poprzedni / z pierwszego na ostatni / gest od krawędzi bez zmiany (Chromium: Android, desktop; WebKit pominięty — sprawdzić ręcznie na iPhonie).
- Wynik: Vitest 50/50, Playwright 45/45 (3 pominięte), lint 0 błędów.

### 2026-11-18 — Pętla przeładowań strony w trybie deweloperskim
- **Objaw:** strona (zwłaszcza logowanie do panelu) przeładowywała się sama kilkanaście razy na sekundę.
- **Przyczyna:** testy E2E budowały wersję produkcyjną (`next build`) do tego samego katalogu `.next`, którego używa `next dev`. Uszkodzona pamięć podręczna Turbopacka powodowała przy każdym wczytaniu komunikat „HMR hash mismatch” → przeładowanie.
- **Naprawa:** wyczyszczenie `.next`; testy E2E budują teraz do osobnego katalogu `.next-e2e` (`distDir` z `NEXT_DIST_DIR`). Zweryfikowano: E2E uruchomione przy działającym `next dev` — po nich 0 przeładowań.
- Ustabilizowano test „koszyk przetrwa odświeżenie” (WebKit: kliknięcie przed hydratacją) — 2 pełne przebiegi z rzędu: 45/45.
- **Gdyby problem wrócił:** zatrzymaj serwer, usuń katalog `.next`, uruchom ponownie `npm run dev`.

---

## 2026-11-19 — Dźwięk w filmach HERO

- **Zgłoszenie:** wgrane filmy nie mają dźwięku.
- **Przyczyna:** świadoma decyzja D-012 (wycinanie dźwięku, bo przeglądarki autoodtwarzają tylko wyciszone filmy) — podjęta bez konsultacji z użytkownikiem.
- **Zmiana (D-013):** dźwięk zostaje w pliku; film startuje wyciszony, przycisk 🔊 włącza/wyłącza dźwięk; przełącznik w panelu; automatyczne wyciszenie po przewinięciu poza HERO.
- Kopia bazy przed migracją 0004: `data/backup-przed-dzwiekiem-20261119-2116`.
- **Testy:** Vitest 52/52 (+2: dźwięk zachowany w AAC / brak ścieżki w niemym filmie; przycisk dźwięku tylko dla filmu), Playwright 45/45 (3 pominięte) — E2E: wgranie filmu z dźwiękiem → przełącznik domyślnie włączony → na stronie film wyciszony → „Włącz dźwięk” → `muted=false` → „Wycisz” (Android, iPhone/WebKit, desktop).

### 2026-11-19 — Przycisk dźwięku niewidoczny na telefonie
- **Zgłoszenie:** na komputerze przycisk dźwięku jest, na telefonie nie.
- **Przyczyna:** na telefonie przycisk leżał na samym dole sekcji HERO (pod przyciskami „Odkryj biżuterię”) — poza pierwszym widokiem, pod paskiem przeglądarki.
- **Naprawa:** na telefonie przycisk jest NA filmie (pod etykietą produktu), z napisem „Włącz dźwięk”; po włączeniu — sama ikona. Test E2E sprawdza, że przycisk jest w pierwszym widoku.
- Przy okazji: `next dev` przestał wykrywać zmiany w `globals.css` (serwował stare style) — pomogło wyczyszczenie `.next` i restart. **Jeśli zmiana stylów „nie wchodzi”: zatrzymaj serwer, usuń `.next`, uruchom ponownie.**
- Testy: Vitest 52/52, Playwright 45/45 (3 pominięte).
- Włączenie dźwięku zaczyna film od początku (wyciszenie nie przewija). Test E2E: film gra > 0,8 s → „Włącz dźwięk” → czas < 0,6 s. Playwright 45/45.
- Po zakończeniu filmu wchodzi następny slajd (z ostatniego — pierwszy); dźwięk, jeśli włączony, zostaje dla kolejnego filmu. Przy jednym slajdzie film gra w pętli. Zweryfikowano na serwerze dev (film 3 s → slajd 02) i testem E2E. Playwright 45/45.

---

## 2026-11-19 — Pionowe filmy na komputerze; napisy pieczęci na telefonie

- **Zgłoszenie 1:** pionowy film (9:16 z telefonu) na komputerze był mocno ucięty — widać ~1/3 kadru.
- **Rozwiązanie:** proporcje obrazu zapisywane przy wgrywaniu (`hero_slides.aspect`, migracja 0005; odczyt z przetworzonego pliku, więc obrót z metadanych iPhone'a jest uwzględniony). Na komputerze i tablecie pionowe media (proporcja < 0,9) mają ramkę 15:16 po prawej — widać ~3/5 wysokości filmu 9:16 — z 10% tła przy prawej krawędzi; tytuł i opis po lewej. Telefon bez zmian. Starsze slajdy bez zapisanych proporcji: rozpoznanie w przeglądarce, a przy zapisie w panelu serwer uzupełnia je z pliku.
- Przy okazji: zmniejszanie ogranicza teraz DŁUŻSZY bok (pionowy film 1080×1920 → 720×1280), wcześniej tylko szerokość.
- Przycisk dźwięku przy pionowym filmie — wewnątrz ramki.
- **Zgłoszenie 2:** na telefonie pieczęć z liściem bez napisów (ukryte przy przeglądzie UX — 5 px). **Rozwiązanie:** na telefonie pieczęć 98 px z napisami jak na komputerze.
- Kopia bazy przed migracją: `data/backup-przed-proporcjami-20261119-2309`.
- **Testy:** Vitest 54/54 (+2: proporcje 16:9 / 9:16 / zdjęcie; walidacja proporcji), Playwright 45/45 (3 pominięte) — E2E: pionowy film z dźwiękiem → klasa `hero-portrait`, na komputerze ramka ≈15:16, ≈10% tła po prawej, widoczne 55–65% wysokości filmu; napisy pieczęci widoczne na wszystkich urządzeniach.- Boki pionowego filmu na komputerze płynnie przechodzą w przezroczystość (`mask-image`), zamiast twardych krawędzi. Testy desktop 15/15.
- Komputer: pionowe media w ramce na połowę szerokości ekranu (prośba właściciela; przy tej samej wysokości HERO widać ok. połowy wysokości filmu 9:16). Poziome zdjęcia/filmy — lewa krawędź płynnie przechodzi w tło. Uwaga techniczna: `next dev` na Windows nie wykrywa dopisania tekstu na końcu pliku — zmiany robić zwykłym zapisem. Playwright 45/45.

---

## 2026-11-20 — Kamienie naturalne: panel, strony kamieni, sekcja na stronie głównej

### Zrobione
- **Panel → „Kamienie”** (6. pozycja w menu): lista z liczbą produktów, oznaczenia „Strona główna” / „Uzupełnij opis/zdjęcie” / „Ukryty”; formularz: nazwa, podpis, opis (akapity), **galeria do 8 zdjęć** (kolejność strzałkami, pierwsze = główne, zdjęcia z galerii/aparatu przez istniejący moduł wgrywania), adres strony, „pokaż na stronie głównej”, widoczność, kolejność; usuwanie zablokowane dla kamieni w produktach.
- **Formularz produktu:** podpowiedzi kamieni ze słownika; nowy wpisany kamień trafia do słownika.
- **Sklep:** sekcja „Każdy kamień ma swoją historię” z kamieni oznaczonych w panelu → **/kamienie/[slug]**: galeria (przesuwanie palcem, miniatury), opis, „Biżuteria z kamieniem …” (link otwiera kartę produktu w sklepie: `/?produkt=…`), „Poznaj inne kamienie”; **/kamienie** — wszystkie kamienie; metadane SEO; nieistniejący kamień → 404.
- Decyzja D-014; migracja 0006; kopia bazy: `data/backup-przed-kamieniami-slownik-20261120-0040`.

### Wynik testów
Raport T-004.
### 2026-11-20 — Automatyczne przełączanie slajdów ze zdjęciem
- Slajd ze zdjęciem przechodzi dalej po 10 s (`HERO_IMAGE_SECONDS`); film — po zakończeniu. Licznik od nowa po każdej zmianie (także ręcznej). Pauza: otwarte okno (produkt, koszyk, menu), kursor myszy nad HERO; brak automatu przy „ogranicz ruch” i przy jednym slajdzie.
- Błąd wykryty testem na iPhonie: Safari po dotknięciu „udaje” najechanie myszą — pauza po najechaniu blokowała przełączanie na dobre. Naprawa: pauza tylko dla prawdziwej myszy (`pointerType === "mouse"`).
- Testy E2E ze sztucznym zegarem (9 s — bez zmiany, 10 s — zmiana, ręczna zmiana zeruje licznik, okno wstrzymuje; „ogranicz ruch” — bez zmian). Playwright 60/60 (3 pominięte). Weryfikacja na serwerze dev w czasie rzeczywistym.
### 2026-11-20 — Karuzela kamieni na stronie głównej
- Zgłoszenie: przy 5 kamieniach karty tworzyły drugi rząd.
- Zmiana: jeden rząd przesuwany w bok — telefon: palcem (zaczepianie na karcie, widać kawałek następnej) + strzałki; komputer: strzałki ← → (wyszarzone na początku/końcu, ukryte gdy wszystko się mieści) i gładzik. Limit kamieni w sekcji 6 → 12.
- Błąd wykryty testem: rola `listitem` na kartach nadpisała rolę linku (czytniki ekranu nie widziały linków) — usunięta.
- Test E2E: zawsze jeden rząd, brak przewijania strony w bok, strzałka przesuwa karuzelę i włącza „wstecz”. Playwright 63/63 (3 pominięte).
### 2026-11-24 — Ponowna pętla przeładowań (iPhone) — przyczyna źródłowa
- **Objaw:** strona główna przeładowywała się w kółko (Safari/iPhone: 21 razy w 12 s; Android: sporadycznie), log: „Fast Refresh rebuilding” → „HMR hash mismatch”.
- **Przyczyna:** Next 16 domyślnie zachowuje pamięć podręczną `next dev` na dysku między uruchomieniami (`turbopackFileSystemCacheForDev`). Po zmianach kodu przy wyłączonym serwerze była nieaktualna. (Poprzednia naprawa — osobny katalog `.next-e2e` — usuwała tylko drugą przyczynę.)
- **Naprawa:** `experimental.turbopackFileSystemCacheForDev: false` w `next.config.ts` + jednorazowe wyczyszczenie `.next`. Weryfikacja: iPhone i Android, oba adresy sieciowe, także po zwykłym restarcie serwera — 0 przeładowań. Koszt: start serwera kilka sekund dłuższy.
### 2026-11-24 — Usuwanie zamówień w panelu
- Strona zamówienia: „Usuń zamówienie” z potwierdzeniem; lista zamówień: zaznaczanie (także „Zaznacz wszystkie”) i „Usuń zaznaczone” w pasku nad dolnym menu.
- Stan magazynowy: zamówienia niewysłane (do potwierdzenia / potwierdzone / opłacone) → produkty wracają na stan; wysłane/zrealizowane → bez zwrotu; anulowane → stan zwrócono już przy anulowaniu (`deleteOrders`, jedna transakcja; pozycje usuwa ON DELETE CASCADE).
- Ostrzeżenie w potwierdzeniu dla zamówień opłaconych / wysłanych / zrealizowanych: to dokumenty sprzedaży, zwykle wymagane do księgowości.
- Testy: integracyjny (zwrot na stan wg statusu, usunięcie pozycji, nieistniejące id), E2E (pojedyncze + 2 naraz, brak przewijania w bok). Vitest 64/64, Playwright 66/66 (3 pominięte).
---

## 2026-11-24 — Poprawki mobilne + podstrony „Pracownia” i „Pielęgnacja”

| # | Zgłoszenie | Zmiana |
|---|---|---|
| 1 | Większe ikony w nagłówku (telefon) | ikony 26 px, licznik koszyka 20 px |
| 2 | Krótsze etykiety filtrów | „Wszystkie kamienie” → „Wszystkie”, „Polecane przez pracownię” → „Polecane” (tylko tekst; wartości filtrów bez zmian) |
| 3 | Karuzela kamieni bez końca | po ostatnim kamieniu — pierwszy (i odwrotnie), palcem i strzałkami (D-016) |
| 4 | Różne rozmiary pól wyboru w panelu „Kamienie” | długi opis ściskał pole — stały rozmiar 24×24 |
| 5 | Edycja „Poznaj naszą pracownię” | podstrona `/pracownia`: zdjęcie nagłówkowe + galeria (powiększanie, przesuwanie palcem), treść; osobna zajawka na stronie głównej z własnym zdjęciem (D-015) |
| 6 | Edycja „Pielęgnacja biżuterii” | podstrona `/pielegnacja` (śródtytuły „## ”) |

- Wszystkie linki „O pracowni”, „Poznaj naszą historię”, „Zajrzyj do świata M.art”, „Pielęgnacja biżuterii” prowadzą do nowych podstron.
- Panel: zakładka „Strona” → sekcja „Podstrony”.
- Kopia bazy przed migracją 0007: `data/backup-przed-podstronami-20261124-2113`.
- **Testy:** raport T-005.