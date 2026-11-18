# Rejestr decyzji technicznych

Każda decyzja: **kontekst → decyzja → konsekwencje**. Nowe decyzje dopisujemy na końcu.

### D-001 · Projekt poza OneDrive (2026-11-17)
**Kontekst:** folder roboczy leży w OneDrive; `node_modules` i `.next` to dziesiątki tysięcy plików.
**Decyzja:** kod w `E:\m-art-sklep`, synchronizacja przez GitHub.
**Konsekwencje:** brak błędów blokady plików; na każdym komputerze trzeba sklonować repozytorium.

### D-002 · Lokalna baza: PGlite, serwer: PostgreSQL (2026-11-17)
**Kontekst:** brak serwera i brak zainstalowanego PostgreSQL/Dockera; projekt ma się łatwo przenieść na serwer.
**Decyzja:** PGlite (PostgreSQL skompilowany do WASM, działa w procesie Node) dla pracy lokalnej; ten sam schemat Drizzle i te same migracje SQL dla PostgreSQL na serwerze. Wybór przez `DATABASE_URL`.
**Konsekwencje:** zero instalacji bazy; identyczny dialekt SQL lokalnie i na produkcji. **PGlite obsługuje tylko jeden proces** — dlatego plik blokady (`data/pglite.lock`), skrypty wymagają zatrzymania serwera, a testy E2E działają z `workers: 1` na osobnej bazie.

### D-003 · `next build` nie dotyka bazy (2026-11-17)
**Kontekst:** build uruchamia wiele procesów; PGlite nie może być otwarte wielokrotnie, a na CI nie ma bazy.
**Decyzja:** strony czytające bazę są dynamiczne (`force-dynamic`), bootstrap pomija fazę buildu.
**Konsekwencje:** build działa bez bazy; brak statycznego cache stron (przy tej skali bez znaczenia).

### D-004 · Własna, prosta autoryzacja admina (2026-11-17)
**Decyzja:** scrypt (parametry zapisane w hashu), sesje w tabeli `admin_sessions` (w bazie tylko SHA-256 tokena), ciasteczko httpOnly + SameSite=Lax (+ `__Host-` i Secure na produkcji), `requireAdmin()` w każdej stronie **i każdej Server Action**. Brak middleware.
**Konsekwencje:** brak zewnętrznych zależności; łatwo dodać kolejne konta. Rozważyć 2FA przed uruchomieniem produkcyjnym.

### D-005 · Limit prób logowania w pamięci procesu (2026-11-17)
**Decyzja:** 5 prób / 15 min na parę e-mail+IP, w pamięci.
**Konsekwencje:** wystarczające dla jednej instancji; zeruje się po restarcie. Przy wielu instancjach przenieść do bazy/Redis.

### D-006 · Produkty zamawiane są ukrywane, nie usuwane (2026-11-17)
**Decyzja:** `order_items` przechowuje kopię nazwy i ceny i nie ma klucza obcego do `products`; „Usuń” w panelu fizycznie usuwa tylko produkty, których nikt nie zamówił — pozostałe ukrywa.
**Konsekwencje:** historia zamówień zawsze kompletna. Adres (slug) produktu nie zmienia się po utworzeniu.

### D-007 · Zdjęcia poza katalogiem builda, serwowane przez `/media` (2026-11-17)
**Decyzja:** upload do `UPLOAD_DIR`, nazwy losowe (32 hex), typ wykrywany po zawartości (JPG/PNG/WEBP, max 5 MB), route `/media/[plik]` przyjmuje tylko nazwy pasujące do wzorca. SVG celowo niedozwolone (ryzyko XSS).
**Konsekwencje:** działa po `next build` i na serwerze; później łatwo podmienić na S3/R2 w `src/lib/uploads.ts`.

### D-008 · Integracje płatności/wysyłek dopiero przy wyborze operatora (2026-11-17)
**Kontekst:** doradca techniczny odradził budowanie abstrakcyjnych interfejsów „na zapas”.
**Decyzja:** teraz tylko pola w bazie (`payment_provider/status/ref`, `shipping_provider/ref`, `tracking_number`); moduły powstaną w etapach 6–7 pod konkretne API.

### D-009 · Next.js 16.4.2 → 16.4.6 (2026-11-17)
**Kontekst:** `npm audit` zgłosił umiarkowaną podatność (GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8 — wyciek cache przy `use cache`).
**Decyzja:** aktualizacja do 16.4.6 (wersja poprawkowa). Wersje zależności przypięte dokładnie.

### D-010 · Kamienie jako lista przy produkcie (2026-11-18)
**Kontekst:** naszyjniki bywają z kilku kamieni; pojedyncze pole „Kamień” nie pozwalało ich opisać ani znaleźć w filtrze.
**Decyzja:** kolumna `products.stones text[]` (migracje 0001 — dodanie + przeniesienie danych, 0002 — usunięcie `stone`). Podpowiedzi w panelu budowane z kamieni już użytych w produktach; nazwy ujednolicane (wielka litera, bez duplikatów, max 10).
**Konsekwencje:** prosty model bez dodatkowych tabel. Gdy kamienie dostaną własne opisy/zdjęcia (np. sekcja „Kamienie naturalne” zarządzana z panelu), przejść na tabelę `stones` + tabelę łączącą.

### D-011 · Testowanie na telefonie w sieci lokalnej (2026-11-18)
**Decyzja:** `allowedDevOrigins` w `next.config.ts` dla adresów sieci prywatnych (192.168.*, 10.*, 172.16.*). Next.js 16 domyślnie blokuje skrypty deweloperskie dla adresów innych niż localhost — strona na telefonie nie reagowała na dotyk.
**Konsekwencje:** dotyczy tylko `npm run dev`; produkcja bez zmian.

### D-012 · Slajdy HERO z panelu, zdjęcia i filmy przetwarzane przez ffmpeg (2026-11-18)
**Kontekst:** właściciel chce sam wstawiać zdjęcie lub film z galerii telefonu. Filmy z iPhone'a to HEVC/MOV (Chrome na Androidzie często ich nie odtwarza) i ważą dziesiątki MB — za dużo dla klientów na danych komórkowych.
**Decyzja:** tabela `hero_slides` (migracja 0003 przenosi 3 slajdy ze wzoru). Upload przez osobny endpoint `/api/admin/upload` (strumieniowo, sesja admina + kontrola Origin), konwersja `ffmpeg-static`: film → MP4 H.264, maks. 1280 px, 20 s, bez dźwięku, `faststart`, + kadr startowy JPG; zdjęcie → JPG maks. 2000 px. `/media` obsługuje Range (206) — wymagane przez Safari. Wideo: `muted autoplay loop playsinline`, pauza przy „ogranicz ruch”.
**Konsekwencje:** +~80 MB w `node_modules` (binarka ffmpeg); konwersja trwa kilka–kilkadziesiąt sekund (synchronicznie). Przy większym ruchu przenieść konwersję do kolejki w tle. Porzucone wgrania (bez zapisu slajdu) zostawiają pliki — do sprzątania w przyszłości.
