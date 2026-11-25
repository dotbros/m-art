#!/usr/bin/env bash
# Wysyła paczkę (npm run deploy:build) na hosting i restartuje aplikację. Uruchamiać w Git Bash:
#   bash scripts/deploy-upload.sh
# Wymaga klucza SSH ~/.ssh/m-art-deploy (dodany w panelu hostingu: Klucze SSH → Autoryzacja).
# Plik .env na serwerze i dane (baza, ~/m-art-data/uploads) NIE są nadpisywane.
set -euo pipefail
HOST="${DEPLOY_HOST:-marthmcl@h7.hitme.net.pl}"
PORT="${DEPLOY_PORT:-10022}"
APP="${DEPLOY_APP:-m-art-sklep}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/m-art-deploy}"
SSH="ssh -i $KEY -p $PORT -o BatchMode=yes $HOST"

cd "$(dirname "$0")/.."
test -f deploy/m-art-sklep.tgz || { echo "Brak deploy/m-art-sklep.tgz — najpierw: npm run deploy:build"; exit 1; }

echo "▶ Wysyłanie paczki"
$SSH 'mkdir -p ~/deploy-tmp'
scp -q -i "$KEY" -P "$PORT" deploy/m-art-sklep.tgz "$HOST:deploy-tmp/"

echo "▶ Podmiana plików aplikacji"
# node_modules w katalogu aplikacji to dowiązanie do środowiska CloudLinux (nodevenv) — tar nie umie
# rozpakować przez nie, więc rozpakowujemy obok i kopiujemy.
$SSH "set -e
rm -rf ~/deploy-tmp/pkg && mkdir -p ~/deploy-tmp/pkg
tar -xzf ~/deploy-tmp/m-art-sklep.tgz --no-same-owner -C ~/deploy-tmp/pkg
cd ~/$APP
find node_modules/ -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a ~/deploy-tmp/pkg/node_modules/. node_modules/
for f in .next-deploy bin drizzle public next-server.js server.js package.json; do rm -rf \"\$f\"; cp -a ~/deploy-tmp/pkg/\$f .; done
chmod 755 bin/ffmpeg
mkdir -p tmp && touch tmp/restart.txt
rm -rf ~/deploy-tmp/pkg"

echo "▶ Sprawdzenie"
URL="$($SSH "grep -E '^NEXT_PUBLIC_SITE_URL=' ~/$APP/.env | cut -d= -f2-")"
for i in $(seq 1 20); do
  if curl -fsS "$URL/api/health" 2>/dev/null; then echo; echo "✔ Wdrożono: $URL"; exit 0; fi
  sleep 3
done
echo "✖ $URL/api/health nie odpowiada — sprawdź logi: ~/$APP/stderr.log lub panel Node.js"
exit 1
