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
### 2026-11-24 — „Luksusowe” przyciski i nagłówki; zanikanie zdjęcia HERO na telefonie
- Na wzór załącznika właściciela (`src/app/luxe.css`, ładowany po `globals.css`): główne przyciski — złoty gradient z ciemnym napisem i połyskiem przy najechaniu; drugorzędne — cienka złota ramka; „Poznaj naszą historię” w HERO — ramka + strzałka w kółeczku; wyróżnienia w tytułach — złota kursywa (gradient); nadtytuły — złoty kolor i cienka złota linia przed tekstem. Kontrast napisu na złotym przycisku > 4,5:1.
- Telefon: dół zdjęcia/filmu HERO płynnie zanika w tło pod tytułem (wcześniej twarda krawędź).
- Testy: Playwright 77/77 (pełny zestaw po zmianie stylów), ponownie telefony po zmianie zanikania.- Telefon: przyciski HERO w jednej linii (12 px, mniejsze odstępy; kółeczko z ikonką ukryte do 420 px szerokości; zawijanie dopiero poniżej 350 px). Zmierzone dla 360/375/390/412/430 px; test E2E.
- Plakietka produktu na zdjęciu HERO w stylu „szkła” (wzór z załącznika): ciemne półprzezroczyste rozmyte tło, cienka złota ramka, zaokrąglone rogi, złota poświata u dołu, kremowe napisy, linia przy „ODKRYJ”. Poprawka po drodze: nowa reguła nadpisała pozycjonowanie plakietki na telefonie (nachodziła na pieczęć) — pozycjonowanie tylko dla komputera. Playwright: pełny zestaw.
### 2026-11-24 — Slajd z własną kolekcją produktów („Zimowa kolekcja”)
- Panel → slajd → „Dokąd prowadzi slajd”: lista „Odkryj biżuterię prowadzi do” z opcją „★ Wybrane produkty (własna kolekcja)”; po wybraniu — lista produktów ze zdjęciem i ceną, wyszukiwarka, „Tylko zaznaczone”, licznik. Pole `hero_slides.product_ids` (migracja 0008); serwer zostawia tylko istniejące produkty.
- Sklep: „Odkryj biżuterię” na takim slajdzie pokazuje tylko produkty kolekcji (w kolejności zaznaczenia; sortowanie po cenie nadal działa) z etykietą „Kolekcja: … ✕”; plakietka na slajdzie bez produktu w rogu prowadzi do kolekcji.
- Kopia bazy: `data/backup-przed-kolekcjami-20261124-2238`.
- Testy: Vitest 72/72 (+3), Playwright 80/80 (4 pominięte) — E2E: błąd bez zaznaczenia, zaznaczenie 2 produktów wyszukiwarką, w sklepie tylko te 2 w kolejności, usunięcie filtra przywraca całość.
### 2026-11-24 — Galeria zdjęć produktu
- Produkt ma do 10 zdjęć (`products.images`, migracja 0009 przenosi dotychczasowe zdjęcie jako pierwsze); `image` = pierwsze zdjęcie (zgodność: lista, koszyk, strony kamieni).
- Panel: edytor listy zdjęć (jak przy kamieniach/podstronach) — dodawanie z galerii/aparatu przez moduł wgrywania (zmniejszanie do JPG), kolejność, usuwanie; usunięte zdjęcia kasowane z dysku (także przy usunięciu produktu).
- Sklep: karta produktu — galeria przesuwana palcem, kropki, strzałki na komputerze (plakietka i serce zostają na wierzchu); karta w kolekcji — drugie zdjęcie po najechaniu (komputer).
- Weryfikacja na bazie użytkownika: 18/18 produktów ma galerię po migracji. Kopia bazy: `data/backup-przed-galeria-produktow-20261124-2307`.
- Testy: Vitest 74/74 (+2), Playwright 80/80 (4 pominięte) — E2E: 2 zdjęcia w panelu, galeria w karcie produktu (2 zdjęcia, przejście do drugiego), zdjęcie główne z /media (JPG).
### 2026-11-24 — Plakietka na slajdzie i długie tytuły HERO
- Plakietka na zdjęciu HERO tylko przy wybranym „Produkcie w rogu slajdu” (wcześniej — ze wzoru — także przy samym kamieniu).
- Tytuł HERO: każda linia osobno mieści się w jednym wierszu (`FitTitle`) — zmniejsza się tylko linia za długa; krótka zostaje w pełnym rozmiarze (pierwsza wersja zmniejszała obie — poprawione na uwagę właściciela). Poniżej 55% rozmiaru linia się zawija zamiast robić się nieczytelna (bardzo długi tekst na telefonie). Podpowiedź w formularzu slajdu.
- Telefon: większy zapas między przyciskami a kreskami slajdów (animacja wejścia tekstu przesuwała przyciski na kreski).
- Zmierzone: 1650 / 1366 / 1024 px i telefon — brak nachodzenia przycisków na kreski i notkę. Playwright 80/80 (4 pominięte) — E2E: brak plakietki bez produktu, linie tytułu w jednym wierszu (lub zawinięte tylko na telefonie), pierwsza linia większa od długiej drugiej, przyciski nie nachodzą na kreski.
### 2026-11-24 — Lista produktów na stronie głównej (wzór ze zrzutu właściciela)
- Nagłówek „Twoje małe zachwyty” wyśrodkowany, nadtytuł ze złotymi liniami po obu stronach; tło: kremowa poświata + gałązki gipsówki w górnych rogach (własna grafika wektorowa `public/images/decor-sprig.svg`, generowana skryptem).
- Kategorie: zakładki ze złotym podkreśleniem aktywnej, przewijane w bok na telefonie.
- Pasek: liczba produktów z poprawną odmianą (`productCountLabel`) + zaokrąglony przycisk „Filtruj”.
- Karty: zaokrąglone rogi (16 px), jasne tło, cień; serce w białym kółku; plakietka jako kremowa „pigułka”, automatycznie „OSTATNIA SZTUKA” przy 1 szt. (gdy brak własnej); ikona torebki w beżowym kółku obok ceny zamiast „+” na zdjęciu.
- Poprawki po drodze: reguły wzoru (`display: contents`, kolejność `order` na telefonie) rozbijały wiersz ceny — nadpisane.
- Testy: Vitest 75/75 (+1 odmiana), Playwright 83/83 (4 pominięte) — E2E: licznik, „Filtruj”, zaokrąglenie kart, torebka po prawej od ceny w tym samym wierszu.- „Poznaj naszą pracownię” na stronie głównej: zdjęcie w jednym formacie 4:5 na komputerze i telefonie (wcześniej stała wysokość → inny kadr: ok. 5:4 na komputerze, ok. 7:8 na telefonie); zdjęcie jest linkiem do /pracownia (z delikatnym przybliżeniem po najechaniu). Podpowiedź o formacie w panelu. Test E2E: proporcja 0,8 i link na każdym urządzeniu.- Panel → podstrony: ramka „Format zdjęcia” przy polach zdjęć — zajawka pracowni: pionowe 4:5 (np. 1600 × 2000 px, ważny element w środku kadru); nagłówek podstrony: poziome 5:4 (np. 2000 × 1600 px); galeria: dowolny format (miniatury 4:5, powiększenie — całe zdjęcie); pliki JPG/PNG/WEBP/HEIC do 25 MB. Zalecenia w `IMAGE_FORMATS` (lib/pages.ts).
- Nagłówek podstron (/pracownia, /pielegnacja) w jednym formacie 5:4 na komputerze i telefonie (wcześniej 4:3 telefon / 21:9 komputer — zalecenie 5:4 byłoby mylące); na komputerze wyśrodkowany, maks. 960 px. Test E2E proporcji.- KOREKTA (na prośbę właściciela): nagłówek podstron wrócił na pełną szerokość strony (telefon 4:3, komputer szeroki pas 21:9) — ujednolicenie do 5:4 z ograniczoną szerokością wycofane. Zalecenie w panelu: „najlepiej poziome 5:4, np. 2000 × 1600 px; na komputerze wyświetla się jako szeroki pas na całą szerokość — górna i dolna część mogą zostać lekko przycięte, najważniejszy element w środku kadru”. Test E2E: nagłówek = szerokość ekranu.
### 2026-11-25 — Karta produktu (okno) na komputerze
- Zdjęcia bez przycinania: ramka 4:5, `object-fit: contain` (inne formaty — kremowe tło po bokach); na komputerze zdjęcie „przyklejone” przy przewijaniu opisu; także telefon (wcześniej stała wysokość 370 px z przycinaniem).
- Złota podwójna obramówka całego okna produktu.
- Czytelne napisy (wzór: 7–11 px): Kamienie/Materiał 14 px, „Ozdobne opakowanie gratis / Wysyłka” 13,5 px, uwaga „Każdy kamień jest inny…” 13 px, opis 15 px, nadtytuł 11 px, podtytuł 14,5 px, cena 24 px, dostępność 13,5 px.
- Zweryfikowano na produkcie właściciela (zdjęcie 1086×1448 widoczne w całości). Playwright: pełny zestaw.- Karta produktu — poprawka ramki (pierwsza wersja zbyt blada): 3 px złotego gradientu + cienka złota linia 7 px wewnątrz, obramowująca całą zawartość (także zdjęcie) — efekt oprawionego obrazu; złota poświata na zewnątrz.
- Wolne miejsce wokół zdjęcia innego formatu wypełnia to samo zdjęcie rozmyte i przyciemnione (zamiast pustych kremowych pasów); zdjęcie nadal w całości.
- „Dodaj do koszyka” 15 px (było 11 px), wyższy przycisk i licznik sztuk. Playwright: pełny zestaw.

### 2026-11-25 — Strona główna (komputer): większe czcionki
- Na prośbę właściciela, tylko na komputerze (≥761 px), bez zmian na telefonie:
  - pasek „Darmowa dostawa…”: 9 → 13 px;
  - menu w nagłówku i „Koszyk”: 10,5 → 14 px, większe ikony;
  - pasek korzyści („Prawdziwe kamienie”…): tytuły 10,5 → 15 px, podpisy 8,5 → 13 px;
  - linia „Małe serie. Niepowtarzalne kamienie.”: → 14 px; przycisk „Zobacz całą kolekcję” bez zmian.
- Węższe ekrany (761–1100 px): nieco mniejsze rozmiary, żeby menu i korzyści mieściły się w jednym rzędzie.
- Testy: Vitest 75/75, Playwright 83 zaliczone, 4 pominięte (dotyczą innego urządzenia). Pomiar 1366 i 1024 px: brak poziomego przewijania.

### 2026-11-25 — Przejście z PostgreSQL na MariaDB (przygotowanie do wdrożenia)
- Rozpoznanie serwera: DirectAdmin + CloudLinux + LiteSpeed, Node.js do v24 (`/opt/alt`), tylko **MariaDB 10.11**, port 5432 na zewnątrz zablokowany → decyzja D-018.
- **Kopia przed zmianą:** tag i gałąź `wersja-postgresql` na GitHubie; kopia bazy PGlite + eksport JSON + `.env.local` w OneDrive `Backup/baza-postgresql-20261125` (z instrukcją powrotu).
- Lokalnie: przenośna MariaDB 10.11.11 w `E:\m-art-sklep-db` (port 3307, `npm run db:start`).
- Kod: schemat MySQL, nowe migracje (`0000_init_mariadb`, `0001_tresci_startowe`), przepisane zapytania (kamienie w JSON, upsert, usuwanie, zamówienia), testy na MariaDB, E2E na bazie `mart_e2e`; usunięte pakiety PGlite/pg.
- Dane właściciela przeniesione do lokalnej MariaDB (`npm run db:import-pglite`).
- Testy: Vitest 76/76, Playwright 83 zaliczone / 4 pominięte (T-006).

### 2026-11-25 — Pierwsze wdrożenie: https://mart.hmcloud.pl
- Hosting hitme.pl (DirectAdmin, CloudLinux, LiteSpeed/Passenger), aplikacja Node.js 20.20.2 w `~/m-art-sklep`, baza `marthmcl_sklep` (MariaDB 10.11.19).
- Paczka budowana na komputerze (`npm run deploy:build`, standalone) i wysyłana skryptem `scripts/deploy-upload.sh` (SSH z kluczem, port 10022).
- Przeniesione: baza (9 produktów, 11 kamieni, 2 slajdy, podstrony, konto admina; sesje usunięte) i 40 zdjęć/filmów do `~/m-art-data/uploads`.
- Problemy rozwiązane w trakcie: tar przez dowiązanie `node_modules` (inny system plików), junction z Windows w paczce, strona powitalna hostingu przesłaniająca `/`, połączenie z bazą przez IPv6 zamiast gniazda (`DATABASE_SOCKET`), domyślne kodowanie bazy `utf8mb3` → `utf8mb4`.
- Sprawdzenie: `/api/health` OK, strona główna na telefonie (Pixel 7): 43 zdjęcia wczytane, 0 błędów HTTP; czasy odpowiedzi 0,1–0,4 s.
- Narzędzie `bin/zmien-haslo.js` do zmiany hasła admina na serwerze (hasło demo jest w dokumentacji — do zmiany).

### 2026-11-26 — Strona powitalna dla właścicielki (/witaj)
- Osobna strona-prezent, projektowana wyłącznie na telefon (na komputerze kolumna szerokości telefonu): ciemne tło „szkatułki”, podwójna złota ramka z narożnikami, złote logo (kształt z `logo.svg` wypełniony gradientem), teksty pojawiające się po kolei, unoszące się złote drobinki, złoty przycisk „Wejdź do swojego sklepu” → `/`, na dole klucz i napis „Wewnątrz ramki znajdziesz klucz do Twojego królestwa”.
- Niewidoczna dla wyszukiwarek (`noindex`), niepodlinkowana w sklepie; animacje wyłączone przy ustawieniu „ogranicz ruch”.
- Sprawdzone na Pixel 7, iPhone 14 i iPhone SE: brak przewijania w bok, napis przycisku w jednej linii.
- Testy: Vitest 76/76, Playwright 86 zaliczone / 4 pominięte (nowy `welcome.spec.ts` × 3 urządzenia).
- Poprawka (na życzenie): przycisk „Wejdź do swojego sklepu” pojawia się dopiero po przewinięciu do niego — „czarodziejska różdżka”: iskra ze smugą leci łukiem, rozbłysk i złoty krąg, rozsypujące się gwiazdki, przycisk wyłania się z blasku (rozmyty → ostry). Miejsce zarezerwowane (bez skoku układu); przy „ogranicz ruch” widoczny od razu. Test E2E: ukryty do przewinięcia, potem widoczny. Playwright 86/4 pominięte.- Poprawka: efekt „różdżki” startuje 1 s po przewinięciu do przycisku (wcześniej 0,25 s). Test /witaj 3/3.
