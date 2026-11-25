# Wdrożenie na serwer

Aplikacja jest przygotowana do przeniesienia: konfiguracja tylko przez zmienne środowiskowe, migracje SQL w repozytorium, standardowy `next build` + `next start`, zdjęcia poza katalogiem builda.

**Wymagania:** Node.js 22, MariaDB 10.11+ (lub MySQL 8), HTTPS. Baza: [D-018](DECYZJE.md).

## Opcja A — hosting z DirectAdmin / cPanel (CloudLinux, LiteSpeed) — wybrana

Rozpoznanie serwera (2026-11-25): CloudLinux 8, LiteSpeed, Node.js 6–24 w `/opt/alt/alt-nodejsXX`, MariaDB 10.11 (gniazdo `/var/lib/mysql/mysql.sock`), git 2.43, wychodzący port 5432 zablokowany (443 otwarty).

### 1. Baza w panelu
Panel → **Bazy danych** → utwórz bazę (np. `marthmcl_sklep`). Panel poda użytkownika i hasło — zapisz je.
Adres do `.env`: `mysql://UZYTKOWNIK:HASLO@localhost:3306/marthmcl_sklep`
(znaki specjalne w haśle zakoduj: `@` → `%40`, `:` → `%3A`, `/` → `%2F`, `#` → `%23`). Gdy połączenie TCP nie działa: `DATABASE_SOCKET=/var/lib/mysql/mysql.sock`.

### 2. Aplikacja Node.js
Panel → **Setup Node.js App** (CloudLinux Node.js Selector):
- Node.js **22**, tryb **Production**;
- katalog aplikacji np. `~/m-art-sklep`, adres: domena sklepu;
- plik startowy: `server.js` (tworzony przez build — patrz niżej).

### 3. Kod i build
Na hostingu współdzielonym `next build` zwykle przekracza limit pamięci, więc **budujemy na komputerze** i wysyłamy gotową paczkę (`output: "standalone"`). Szczegółowe polecenia uzupełnimy przy pierwszym wdrożeniu.

### 4. Zmienne środowiskowe (w panelu Node.js App lub w `.env` w katalogu aplikacji)
```
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://twoja-domena.pl
DATABASE_URL=mysql://…
AUTO_MIGRATE=true            # migracje przy starcie aplikacji
SEED_DEMO_DATA=false
UPLOAD_DIR=/home/marthmcl/m-art-data/uploads   # POZA katalogiem aplikacji i public_html
ADMIN_EMAIL=…  ADMIN_PASSWORD=…                # tylko do pierwszego startu, potem usuń
```

### 5. Przeniesienie danych z komputera
Lokalna baza → plik SQL → import w panelu (phpMyAdmin) albo przez SSH:
```bash
# komputer:
mariadb-dump --host=127.0.0.1 --port=3307 --user=mart -p --single-transaction --no-tablespaces mart > mart.sql
# serwer:
mysql -u UZYTKOWNIK -p marthmcl_sklep < mart.sql
```
Zdjęcia i filmy: katalog `storage/uploads` → `UPLOAD_DIR` na serwerze (np. `scp -r` lub menedżer plików).

## Opcja B — VPS (np. Hetzner, OVH, Mikr.us)

Ubuntu 24.04, Node.js 22, MariaDB 10.11 (`apt install mariadb-server`), Caddy/Nginx (HTTPS), PM2.
```bash
git clone https://github.com/dotbros/m-art.git /srv/m-art-sklep && cd /srv/m-art-sklep
npm ci && npm run db:migrate && npm run build
pm2 start npm --name mart -- start
```
Caddy: `twoja-domena.pl { reverse_proxy 127.0.0.1:3000; request_body { max_size 210MB } }` (filmy do slajdów HERO — maks. 200 MB przed konwersją). Nginx: `client_max_body_size 210m; proxy_read_timeout 300s;`.
**Aktualizacja:** `git pull && npm ci && npm run db:migrate && npm run build && pm2 restart mart`.

## Uwagi wspólne

- **ffmpeg** instaluje się z `npm ci` (pakiet `ffmpeg-static`, Linux x64) — nie trzeba go instalować osobno. Folder tymczasowy (`/tmp` lub `TMPDIR`) potrzebuje ok. 500 MB.
- **Kopie zapasowe:** codzienny `mariadb-dump` bazy + kopia katalogu `UPLOAD_DIR` (na hostingu — sprawdzić kopie w panelu).

## Lista kontrolna przed uruchomieniem sprzedaży
- [ ] HTTPS działa, `NEXT_PUBLIC_SITE_URL` wskazuje domenę.
- [ ] Silne hasło admina, `ADMIN_PASSWORD` usunięte z pliku po pierwszym starcie.
- [ ] `SEED_DEMO_DATA=false`, dane demo usunięte z panelu.
- [ ] Kopie zapasowe bazy i zdjęć skonfigurowane i przetestowane (odtworzenie!).
- [ ] Regulamin, polityka prywatności, dane sprzedawcy uzupełnione.
- [ ] Klucze płatności/wysyłek produkcyjne (nie sandbox) — tylko w zmiennych środowiskowych.
- [ ] `/api/health` podpięte do monitoringu (np. UptimeRobot).
