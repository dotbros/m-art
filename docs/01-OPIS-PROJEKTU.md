# Opis projektu — sklep internetowy M.art

## Cel
Sklep internetowy pracowni biżuterii **M.art** (ręcznie robiona biżuteria z naturalnych kamieni i pereł) z panelem administracyjnym, w którym osoba prowadząca sklep samodzielnie dodaje produkty, kategorie i obsługuje zamówienia. W kolejnych etapach: płatności online i automatyczne nadawanie paczek.

**Główne założenie: telefon jest najważniejszy.** Zarówno klienci, jak i osoba administrująca sklepem korzystają głównie z urządzeń mobilnych. Każdy ekran projektujemy najpierw na szerokość 360–430 px.

## Punkt wyjścia
Wzór graficzny i techniczny: `Projekty/Exclusive/exclusive-jewelry-mobile-design` (Next.js + Drizzle + PostgreSQL). Zachowujemy jego identyfikację wizualną (kolory, typografia Cormorant/DM Sans/Italianno, ton komunikatów) i rozbudowujemy go o bazę zarządzaną z panelu.

## Zakres funkcjonalny

### Sklep (dla klientów)
- Strona główna z sliderem, korzyściami, kolekcją, sekcją kamieni, historią pracowni, newsletterem.
- Katalog produktów z filtrowaniem po **kategorii** i **kamieniu**, sortowaniem i wyszukiwarką.
- Karta produktu (modal): zdjęcie, opis, kamień, materiał, rozmiar, stan, cena (opcjonalnie cena przed obniżką).
- Ulubione i koszyk zapisywane w przeglądarce.
- Zamówienie: dane klienta, dostawa (kurier / odbiór osobisty), darmowa dostawa od 299 zł, zapis w bazie z kontrolą stanów magazynowych.
- Formularz kontaktowy, newsletter (ze zgodą), strony informacyjne (dostawa, regulamin, prywatność, FAQ, pielęgnacja).

### Panel administracyjny (`/admin`)
- Logowanie (hasło szyfrowane scrypt, sesja w bazie, limit prób).
- **Pulpit**: zamówienia do potwierdzenia, liczba produktów, produkty na wyczerpaniu, ostatnie zamówienia.
- **Kategorie**: dodawanie, edycja, kolejność, ukrywanie, usuwanie (zablokowane, gdy kategoria ma produkty).
- **Produkty**: dodawanie i edycja ze zdjęciem (również z aparatu telefonu), cena, cena przed obniżką, stan, kamień, materiał, rozmiar, etykieta, kolejność, ukrywanie; wyszukiwarka i filtr kategorii.
- **Zamówienia**: lista z filtrem statusu, szczegóły, zmiana statusu zamówienia i płatności, numer przesyłki, notatka wewnętrzna; anulowanie zwraca produkty na stan.

### Planowane integracje
- **Płatności online** — Przelewy24 / PayU / Stripe (BLIK, przelewy, karty).
- **Wysyłki** — InPost ShipX (Paczkomaty, kurier) lub agregator Furgonetka / Apaczka.

Baza jest już na to przygotowana (`orders.payment_*`, `orders.shipping_*`, `tracking_number`).

## Architektura

```
Przeglądarka (telefon) ──► Next.js (App Router, React 19)
                             ├─ strony serwerowe (czytają bazę przy każdym żądaniu)
                             ├─ /api/*   — zamówienia, newsletter, kontakt, health
                             ├─ /admin/* — panel; Server Actions z requireAdmin()
                             └─ /media/* — zdjęcia produktów z UPLOAD_DIR
                                   │
                     Drizzle ORM (jeden schemat, migracje SQL w ./drizzle)
                        ├─ lokalnie: MariaDB 10.11 (przenośna, port 3307)
                        └─ serwer:   MariaDB 10.11 hostingu (DATABASE_URL)
```

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| UI | React 19, CSS (mobile-first), Tailwind 4 dostępny |
| Baza | MariaDB 10.11 / MySQL przez Drizzle ORM (D-018) |
| Autoryzacja | własna: scrypt + sesje w bazie + ciasteczko httpOnly |
| Testy | Vitest (unit + integracja), Playwright (E2E: Pixel 7, iPhone 14, desktop) |
| Repozytorium | Git + GitHub |

## Struktura katalogów

```
src/
  app/            strony, API, panel admina (admin/(panel)/…), /media
  components/     komponenty sklepu i panelu (components/admin)
  db/             schemat bazy, połączenie, migracje
  lib/            logika: katalog, walidacja, zamówienia, auth, upload, seed
drizzle/          migracje SQL (wersjonowane w Git)
scripts/          skrypty CLI (migracje, seed, reset, admin)
tests/            unit / integration / e2e
docs/             dokumentacja projektu (ten katalog)
.claude/agents/   doradca techniczny i doradca UX (agenci Claude Code)
```

## Agenci-doradcy
W `.claude/agents/` są dwaj agenci Claude Code, z którymi konsultowany jest każdy etap:
- **doradca-techniczny** — architektura, bezpieczeństwo, przenośność na serwer, przegląd kodu.
- **doradca-ux** — wygląd, estetyka marki, responsywność i ergonomia na telefonach.

W Claude Code można ich wywołać np.: *„poproś doradcę UX o ocenę formularza produktu”*.
