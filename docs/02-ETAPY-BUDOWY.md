# Etapy budowy projektu

Zasada pracy: **po każdym etapie uruchamiamy testy WSZYSTKICH dotąd zbudowanych modułów** (`npm run test:all`), wynik zapisujemy w [04-RAPORTY-TESTOW.md](04-RAPORTY-TESTOW.md), a przebieg prac w [03-DZIENNIK-WDROZEN.md](03-DZIENNIK-WDROZEN.md). Przed zamknięciem etapu konsultujemy go z doradcą technicznym i doradcą UX.

Legenda: ✅ ukończony · 🔄 w toku · ⏳ zaplanowany

---

## Etap 0 — Fundamenty ✅
- [x] Przeniesienie wzoru „Exclusive” do repozytorium `E:\m-art-sklep` (poza OneDrive).
- [x] Agenci-doradcy: `.claude/agents/doradca-techniczny.md`, `.claude/agents/doradca-ux.md`.
- [x] Konfiguracja: `.env.example`, `.gitignore`, `next.config.ts` (nagłówki bezpieczeństwa, limit uploadu).
- [x] Dokumentacja: `SRODOWISKO.md`, katalog `docs/`.
- [x] Repozytorium Git (lokalne, gałąź `main`) — gotowe do wypchnięcia na GitHub.

**Testy:** typecheck, lint.

## Etap 1 — Baza danych ✅
- [x] Schemat: kategorie, produkty, zamówienia (+ pola pod płatności/wysyłki), pozycje zamówień, newsletter, wiadomości, konta i sesje admina.
- [x] Jeden kod dla PGlite (lokalnie) i PostgreSQL (serwer); blokada przed otwarciem bazy przez dwa procesy.
- [x] Migracje SQL (`drizzle/0000_init.sql`), skrypty `db:migrate`, `db:seed`, `db:reset`.
- [x] Automatyczne migracje + dane demo + konto admina przy starcie lokalnym (`src/instrumentation.ts`).

**Testy:** integracyjne na PGlite w pamięci (migracje, seed, zapytania).

## Etap 2 — Sklep na bazie danych ✅
- [x] Strona główna czyta kategorie/produkty z bazy; filtry kamieni budowane z danych.
- [x] Pola produktu: materiał, rozmiar, cena przed obniżką.
- [x] Zamówienia: walidacja wydzielona do `lib/validation.ts`, logika do `lib/orders.ts`, atomowe zmniejszanie stanów.
- [x] Fonty lokalnie z `@fontsource`, ilustracje zastępcze produktów (SVG).

**Testy:** jednostkowe (walidacja, ceny, dostawa), integracyjne (zamówienia), E2E (ścieżka zakupu na telefonach i desktopie).

## Etap 3 — Panel administracyjny ✅
- [x] Logowanie, sesje, limit prób, wylogowanie.
- [x] Pulpit, CRUD kategorii, CRUD produktów ze zdjęciem, lista i obsługa zamówień.
- [x] Mobile-first: dolna nawigacja, karty zamiast tabel, przyklejony przycisk „Zapisz”, pola 16 px.

**Testy:** jednostkowe (hasła, upload, limit prób), integracyjne (sesje), E2E (logowanie, tworzenie kategorii i produktu ze zdjęciem, widoczność w sklepie, ukrywanie, zamówienia, wylogowanie).

## Etap 4 — GitHub i praca z wielu miejsc ⏳
- [ ] Utworzenie prywatnego repozytorium na GitHubie i `git push` (wymaga Twojego konta — instrukcja w README).
- [ ] GitHub Actions: automatyczne `typecheck + lint + test + e2e` przy każdym pushu.
- [ ] Ochrona gałęzi `main` (zmiany przez Pull Request).

## Etap 5 — Dopracowanie sklepu ⏳
- [ ] Osobne strony produktów i kategorii (`/produkt/[slug]`, `/kategoria/[slug]`) — lepsze SEO i udostępnianie linków.
- [ ] Prawdziwe zdjęcia produktów (wgrane przez panel), kilka zdjęć na produkt (galeria).
- [ ] Optymalizacja zdjęć (`next/image`, WebP/AVIF, rozmiary pod telefony).
- [ ] Panel: podgląd wiadomości z formularza i listy newslettera, eksport CSV.
- [ ] E-maile transakcyjne (potwierdzenie zamówienia, zmiana statusu) — np. Resend / SMTP.
- [ ] Regulamin, polityka prywatności, dane sprzedawcy — treści prawne.

## Etap 6 — Płatności online ⏳
- [ ] Wybór operatora (rekomendacja: **Przelewy24** lub **PayU** — BLIK + szybkie przelewy; alternatywnie Stripe).
- [ ] Moduł `src/lib/payments/` z dostawcą sandbox, rejestracja transakcji, przekierowanie do bramki.
- [ ] Webhook (powiadomienie o płatności): weryfikacja podpisu, idempotencja (`orders.payment_ref` jest unikalny), zmiana `payment_status`.
- [ ] Strona powrotu „Dziękujemy / płatność w toku”.
- [ ] Testy na sandboxie operatora.

## Etap 7 — Wysyłka paczek ⏳
- [ ] Wybór: **InPost ShipX** (Paczkomaty + kurier) lub agregator (Furgonetka / Apaczka — wielu przewoźników jednym API).
- [ ] Wybór Paczkomatu w koszyku (widget mapy InPost) — nowa opcja dostawy.
- [ ] Panel: „Nadaj paczkę” → tworzenie przesyłki przez API, pobranie etykiety PDF, zapis numeru śledzenia.
- [ ] Automatyczna zmiana statusu na „Wysłane” + e-mail z linkiem śledzenia.

## Etap 8 — Wdrożenie na serwer ⏳
- [x] Hosting: DirectAdmin + CloudLinux (Node.js 22, MariaDB 10.11) → przejście aplikacji na MariaDB (D-018).
- [ ] Konfiguracja domeny, HTTPS, zmiennych środowiskowych, kopii zapasowych bazy.
- [ ] Przeniesienie zdjęć do trwałego magazynu (dysk serwera lub S3/R2).
- [ ] Monitoring (`/api/health`), logi błędów.

Instrukcja: [WDROZENIE-NA-SERWER.md](WDROZENIE-NA-SERWER.md).
