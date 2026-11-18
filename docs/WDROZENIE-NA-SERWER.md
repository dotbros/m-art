# Wdrożenie na serwer

Aplikacja jest od początku przygotowana do przeniesienia: konfiguracja tylko przez zmienne środowiskowe, migracje SQL w repozytorium, standardowy `next build` + `next start`, zdjęcia poza katalogiem builda.

## Opcja A — VPS (np. Hetzner, OVH, Mikr.us, home.pl VPS)

Wymagania serwera: Ubuntu 22.04/24.04, **Node.js 22 LTS**, **PostgreSQL 16+**, **Caddy lub Nginx** (HTTPS), **PM2** lub systemd.

```bash
# 1. Baza
sudo -u postgres createuser -P mart
sudo -u postgres createdb -O mart mart

# 2. Kod
git clone https://github.com/<konto>/m-art-sklep.git /srv/m-art-sklep && cd /srv/m-art-sklep
npm ci

# 3. Konfiguracja: /srv/m-art-sklep/.env.local
#   NEXT_PUBLIC_SITE_URL=https://twoja-domena.pl
#   DATABASE_URL=postgres://mart:HASLO@127.0.0.1:5432/mart
#   AUTO_MIGRATE=false
#   SEED_DEMO_DATA=false
#   UPLOAD_DIR=/srv/m-art-data/uploads
#   ADMIN_EMAIL=… ADMIN_PASSWORD=…   (tylko do pierwszego startu, potem usuń)

# 4. Migracje + build + start
npm run db:migrate
npm run build
pm2 start npm --name mart -- start
```

Caddy (automatyczny HTTPS):
```
twoja-domena.pl {
  reverse_proxy 127.0.0.1:3000
  request_body { max_size 210MB }   # filmy do slajdów HERO (maks. 200 MB przed konwersją)
}
```

**Aktualizacja:** `git pull && npm ci && npm run db:migrate && npm run build && pm2 restart mart`.

**Kopie zapasowe:** codzienny `pg_dump` bazy + kopia katalogu `UPLOAD_DIR`.

## Opcja B — platforma (Railway / Render / Vercel)

- Zarządzany PostgreSQL z platformy → `DATABASE_URL`.
- Polecenie startowe z migracjami: `npm run db:migrate && npm start`.
- **Uwaga:** na Vercelu system plików jest ulotny — przed wdrożeniem trzeba przenieść zdjęcia do S3/Cloudflare R2 (zmiana w `src/lib/uploads.ts`).

Nginx: `client_max_body_size 210m;` oraz `proxy_read_timeout 300s;` (konwersja filmu może trwać do kilku minut).

**ffmpeg** instaluje się automatycznie z `npm ci` (pakiet `ffmpeg-static`, wersje dla Windows/Linux/macOS) — nie trzeba go instalować osobno. Folder tymczasowy systemu (`/tmp`) musi mieć ok. 500 MB wolnego miejsca.

## Lista kontrolna przed uruchomieniem sprzedaży
- [ ] HTTPS działa, `NEXT_PUBLIC_SITE_URL` wskazuje domenę.
- [ ] Silne hasło admina, `ADMIN_PASSWORD` usunięte z pliku po pierwszym starcie.
- [ ] `SEED_DEMO_DATA=false`, dane demo usunięte z panelu.
- [ ] Kopie zapasowe bazy i zdjęć skonfigurowane i przetestowane (odtworzenie!).
- [ ] Regulamin, polityka prywatności, dane sprzedawcy uzupełnione.
- [ ] Klucze płatności/wysyłek produkcyjne (nie sandbox) — tylko w zmiennych środowiskowych.
- [ ] `/api/health` podpięte do monitoringu (np. UptimeRobot).
