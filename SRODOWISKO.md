# Środowisko pracy — co zainstalować na komputerze

Ten plik opisuje, co jest potrzebne, żeby budować sklep M.art lokalnie (na dowolnym komputerze z Windows, macOS lub Linuksem), a potem bez przeróbek przenieść go na serwer.

---

## 1. Wymagane (minimum, żeby uruchomić projekt)

| Narzędzie | Wersja | Do czego | Skąd |
|---|---|---|---|
| **Node.js** | **20 LTS (≥ 20.9)** lub 22 LTS | Uruchamia aplikację (Next.js), testy i skrypty | https://nodejs.org → „LTS” |
| **npm** | instaluje się z Node.js | Instalacja bibliotek | — |
| **Git** | ≥ 2.40 | Wersjonowanie, praca z GitHubem z różnych miejsc | https://git-scm.com |
| **Edytor kodu** | dowolny, polecany **VS Code** | Praca z kodem | https://code.visualstudio.com |

Sprawdzenie w terminalu:

```bash
node -v    # v20.x lub v22.x
npm -v
git --version
```

> **Baza danych nie wymaga instalacji.** Lokalnie sklep używa **PGlite** — pełnego PostgreSQL działającego wewnątrz aplikacji i zapisującego dane w katalogu `./data/pglite`. Instaluje się automatycznie z `npm install`. Na serwerze ten sam kod łączy się ze zwykłym PostgreSQL (wystarczy ustawić `DATABASE_URL`).

## 2. Zalecane

| Narzędzie | Do czego |
|---|---|
| **GitHub CLI (`gh`)** — https://cli.github.com | Logowanie do GitHuba, tworzenie repozytorium i PR-ów z terminala |
| **Przeglądarki Playwright** — instalowane poleceniem `npx playwright install chromium webkit` | Testy E2E (Chrome/Android i Safari/iPhone) |
| Rozszerzenia VS Code: *ESLint*, *Playwright Test for VSCode*, *Claude Code* | Podpowiedzi błędów, uruchamianie testów, praca z agentami |

## 3. Opcjonalne — gdy zechcesz testować „jak na produkcji”

| Narzędzie | Kiedy |
|---|---|
| **PostgreSQL 16/17** (https://www.postgresql.org/download/) **albo Docker Desktop** | Żeby lokalnie sprawdzić aplikację na tej samej bazie co na serwerze. Wtedy w `.env.local` ustawiasz `DATABASE_URL=postgres://…` i uruchamiasz `npm run db:migrate`. |

Przykład z Dockerem:

```bash
docker run -d --name mart-pg -e POSTGRES_USER=mart -e POSTGRES_PASSWORD=mart -e POSTGRES_DB=mart -p 5432:5432 postgres:17
# .env.local:  DATABASE_URL=postgres://mart:mart@127.0.0.1:5432/mart
```

---

## 4. Pierwsze uruchomienie na nowym komputerze

```bash
git clone https://github.com/<twoje-konto>/m-art-sklep.git
cd m-art-sklep
npm install
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local
# (opcjonalnie) zmień ADMIN_EMAIL i ADMIN_PASSWORD w .env.local
npm run dev                       # http://localhost:3000  •  panel: http://localhost:3000/admin
```

Przy pierwszym starcie aplikacja sama:
1. tworzy bazę w `./data/pglite` i wykonuje migracje,
2. wgrywa produkty demonstracyjne,
3. zakłada konto administratora z `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

> Jeśli port 3000 jest zajęty: `npm run dev -- -p 3200`.

## 5. Ważne zasady

- **Nie trzymaj projektu w folderze OneDrive / Dropbox / Google Drive.** Synchronizacja `node_modules` i `.next` powoduje błędy (EPERM, zablokowane pliki). Synchronizację między komputerami zapewnia GitHub.
- **Lokalna baza (`data/`) i wgrane zdjęcia (`storage/`) nie trafiają do GitHuba.** Każdy komputer ma własne dane testowe. Prawdziwe dane będą tylko na serwerze.
- **Pliki `.env.local` nie trafiają do GitHuba** — zawierają hasła i klucze. Na każdym komputerze tworzysz je z `.env.example`.
- **Baza PGlite może być otwarta tylko przez jeden proces.** Przed `npm run db:seed`, `db:migrate`, `admin:create`, `db:reset` zatrzymaj `npm run dev` (Ctrl+C). Skrypt sam o tym przypomni.

## 6. Najważniejsze polecenia

| Polecenie | Co robi |
|---|---|
| `npm run dev` | Serwer deweloperski z podglądem zmian na żywo |
| `npm run build` / `npm start` | Wersja produkcyjna (tak jak na serwerze) |
| `npm run typecheck` | Sprawdzenie typów TypeScript |
| `npm run lint` | Sprawdzenie jakości kodu (ESLint) |
| `npm test` | Testy jednostkowe i integracyjne (Vitest) |
| `npm run test:e2e` | Testy w przeglądarkach na telefonach i desktopie (Playwright) |
| `npm run test:all` | Wszystko powyżej po kolei — uruchamiaj przed każdym `git push` |
| `npm run db:generate` | Po zmianie `src/db/schema.ts` — tworzy nową migrację SQL w `drizzle/` |
| `npm run db:migrate` | Wykonuje migracje (lokalnie robi się samo; na serwerze — ręcznie przy wdrożeniu) |
| `npm run db:seed` | Wgrywa dane demo do pustej bazy |
| `npm run db:reset` | Kasuje LOKALNĄ bazę (nie działa na PostgreSQL — ochrona danych) |
| `npm run admin:create -- email hasło` | Tworzy konto admina lub zmienia mu hasło |

## 7. Przeniesienie na serwer

Szczegóły: [docs/WDROZENIE-NA-SERWER.md](docs/WDROZENIE-NA-SERWER.md). W skrócie serwer potrzebuje: **Node.js 20/22 LTS**, **PostgreSQL 16+**, **reverse proxy z HTTPS** (Nginx/Caddy) oraz **menedżera procesów** (PM2 lub systemd). Alternatywnie hosting typu Vercel/Railway/Render + zarządzany PostgreSQL.
