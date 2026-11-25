# Środowisko pracy — co zainstalować na komputerze

Ten plik opisuje, co jest potrzebne, żeby budować sklep M.art lokalnie (na dowolnym komputerze z Windows, macOS lub Linuksem), a potem bez przeróbek przenieść go na serwer.

---

## 1. Wymagane (minimum, żeby uruchomić projekt)

| Narzędzie | Wersja | Do czego | Skąd |
|---|---|---|---|
| **Node.js** | **22 LTS** (≥ 20.9) | Uruchamia aplikację (Next.js), testy i skrypty | https://nodejs.org → „LTS” |
| **npm** | instaluje się z Node.js | Instalacja bibliotek | — |
| **Git** | ≥ 2.40 | Wersjonowanie, praca z GitHubem z różnych miejsc | https://git-scm.com |
| **MariaDB** | **10.11 LTS** (ta sama co na serwerze) | Baza danych sklepu | instrukcja niżej |
| **Edytor kodu** | dowolny, polecany **VS Code** | Praca z kodem | https://code.visualstudio.com |

Sprawdzenie w terminalu:

```bash
node -v    # v22.x
npm -v
git --version
```

## 2. Baza danych — MariaDB 10.11 (D-018)

Sklep używa **MariaDB / MySQL**, bo tylko taką bazę ma hosting. Lokalnie działa ta sama wersja co na serwerze (10.11), na porcie **3307** (żeby nie kolidować z inną bazą na 3306).

### Windows — wersja przenośna, bez instalatora i bez uprawnień administratora

```powershell
# 1. Pobierz i rozpakuj (ok. 86 MB) do E:\m-art-sklep-db  (poza OneDrive!)
$d='E:\m-art-sklep-db'; New-Item -ItemType Directory -Force $d
Invoke-WebRequest https://archive.mariadb.org/mariadb-10.11.11/winx64-packages/mariadb-10.11.11-winx64.zip -OutFile $d\m.zip
Expand-Archive $d\m.zip $d; Remove-Item $d\m.zip
$b="$d\mariadb-10.11.11-winx64\bin"

# 2. Katalog danych (hasło roota tylko lokalne)
& "$b\mariadb-install-db.exe" --datadir=$d\data --port=3307 --password=mart-local-root
```

3. W pliku `E:\m-art-sklep-db\data\my.ini`, w sekcji `[mysqld]`, dopisz (tak samo jak na serwerze):

```ini
bind-address=127.0.0.1
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
sql_mode=STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION
default-time-zone=+00:00
max_allowed_packet=64M
```

4. Uruchom bazę (`npm run db:start`) i załóż bazy oraz użytkownika:

```sql
-- "$b\mariadb.exe" --host=127.0.0.1 --port=3307 --user=root --password=mart-local-root
CREATE DATABASE mart     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;  -- dane do pracy
CREATE DATABASE mart_e2e CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;  -- testy E2E
CREATE USER 'mart'@'127.0.0.1' IDENTIFIED BY 'mart-local';
GRANT ALL ON mart.*         TO 'mart'@'127.0.0.1';
GRANT ALL ON mart_e2e.*     TO 'mart'@'127.0.0.1';
GRANT ALL ON `mart\_t\_%`.* TO 'mart'@'127.0.0.1';  -- testy integracyjne zakładają własne bazy mart_t_…
```

Inna lokalizacja niż `E:\m-art-sklep-db`? Ustaw `MARIADB_HOME` w `.env.local`.
**macOS / Linux:** `brew install mariadb@10.11` albo `apt install mariadb-server`, potem kroki 3–4 (port w `DATABASE_URL`).

## 3. Zalecane

| Narzędzie | Do czego |
|---|---|
| **GitHub CLI (`gh`)** — https://cli.github.com | Logowanie do GitHuba, tworzenie repozytorium i PR-ów z terminala |
| **Przeglądarki Playwright** — `npx playwright install chromium webkit` | Testy E2E (Chrome/Android i Safari/iPhone) |
| Rozszerzenia VS Code: *ESLint*, *Playwright Test for VSCode*, *Claude Code* | Podpowiedzi błędów, uruchamianie testów, praca z agentami |

---

## 4. Pierwsze uruchomienie na nowym komputerze

```bash
git clone https://github.com/dotbros/m-art.git m-art-sklep
cd m-art-sklep
npm install
cp .env.example .env.local        # Windows PowerShell: Copy-Item .env.example .env.local
# (opcjonalnie) zmień ADMIN_EMAIL i ADMIN_PASSWORD w .env.local
npm run db:start                  # lokalna MariaDB (po każdym restarcie komputera)
npm run dev                       # http://localhost:3000  •  panel: http://localhost:3000/admin
```

Przy pierwszym starcie aplikacja sama:
1. wykonuje migracje (tabele + treści startowe podstron i slajdów),
2. wgrywa produkty demonstracyjne (`SEED_DEMO_DATA=true`),
3. zakłada konto administratora z `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

> Jeśli port 3000 jest zajęty: `npm run dev -- -p 3200`.

## 5. Ważne zasady

- **Nie trzymaj projektu ani bazy w folderze OneDrive / Dropbox / Google Drive.** Synchronizacja `node_modules`, `.next` i plików bazy powoduje błędy (EPERM, zablokowane pliki). Synchronizację kodu między komputerami zapewnia GitHub.
- **Lokalna baza i wgrane zdjęcia (`storage/`) nie trafiają do GitHuba.** Każdy komputer ma własne dane testowe. Prawdziwe dane będą tylko na serwerze.
- **Pliki `.env.local` nie trafiają do GitHuba** — zawierają hasła i klucze. Na każdym komputerze tworzysz je z `.env.example`.

## 6. Najważniejsze polecenia

| Polecenie | Co robi |
|---|---|
| `npm run db:start` | Uruchamia lokalną MariaDB w tle (jeśli już działa — nic nie robi) |
| `npm run dev` | Serwer deweloperski z podglądem zmian na żywo |
| `npm run build` / `npm start` | Wersja produkcyjna (tak jak na serwerze) |
| `npm run typecheck` | Sprawdzenie typów TypeScript |
| `npm run lint` | Sprawdzenie jakości kodu (ESLint) |
| `npm test` | Testy jednostkowe i integracyjne (Vitest, na lokalnej MariaDB) |
| `npm run test:e2e` | Testy w przeglądarkach na telefonach i desktopie (Playwright) |
| `npm run test:all` | Wszystko powyżej po kolei — uruchamiaj przed każdym `git push` |
| `npm run db:generate` | Po zmianie `src/db/schema.ts` — tworzy nową migrację SQL w `drizzle/` |
| `npm run db:migrate` | Wykonuje migracje (lokalnie robi się samo; na serwerze — przy wdrożeniu) |
| `npm run db:seed` | Wgrywa dane demo do pustej bazy |
| `npm run db:reset` | Czyści LOKALNĄ bazę (działa tylko dla 127.0.0.1/localhost — ochrona danych) |
| `npm run admin:create -- email hasło` | Tworzy konto admina lub zmienia mu hasło |

## 7. Przeniesienie na serwer

Szczegóły: [docs/WDROZENIE-NA-SERWER.md](docs/WDROZENIE-NA-SERWER.md). Serwer potrzebuje: **Node.js 22**, **MariaDB 10.11+ / MySQL 8** i HTTPS. Docelowo: hosting z panelem DirectAdmin (CloudLinux, LiteSpeed, „Setup Node.js App”).
