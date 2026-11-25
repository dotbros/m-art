// Buduje paczkę na hosting (CloudLinux „Setup Node.js App”, Linux x64) — na komputerze, bo `next build`
// przekracza limit pamięci hostingu. Wynik: deploy/m-art-sklep/ i deploy/m-art-sklep.tgz
//   npm run deploy:build
// Na serwerze: rozpakować do katalogu aplikacji (bez nadpisywania .env), restart aplikacji w panelu.
import { execSync } from "node:child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

const ROOT = process.cwd();
const DIST = ".next-deploy";
const OUT = path.join(ROOT, "deploy", "m-art-sklep");
const FFMPEG_URL = "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64.gz";
const FFMPEG_CACHE = path.join(ROOT, "data", "ffmpeg-linux-x64-b6.1.1");

const step = (s: string) => console.log(`\n▶ ${s}`);

step("Build produkcyjny (standalone)");
rmSync(path.join(ROOT, DIST), { recursive: true, force: true });
execSync("npx next build", { stdio: "inherit", env: { ...process.env, NODE_ENV: "production", NEXT_OUTPUT_STANDALONE: "true", NEXT_DIST_DIR: DIST } });

step("Składanie paczki");
rmSync(path.join(ROOT, "deploy"), { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const SA = path.join(ROOT, DIST, "standalone");
// Tylko to, czego aplikacja potrzebuje (śledzenie plików Next.js łapie też np. tests/, storage/ — pomijamy je;
// .env i dane lokalne NIE trafiają na serwer). `dereference`: Next tworzy na Windows połączenia (junction)
// z bezwzględnymi ścieżkami — kopiujemy prawdziwe pliki.
for (const item of ["server.js", "package.json", "node_modules", DIST]) {
  cpSync(path.join(SA, item), path.join(OUT, item), { recursive: true, dereference: true });
}
cpSync(path.join(ROOT, DIST, "static"), path.join(OUT, DIST, "static"), { recursive: true });
cpSync(path.join(ROOT, "public"), path.join(OUT, "public"), { recursive: true });
cpSync(path.join(ROOT, "drizzle"), path.join(OUT, "drizzle"), { recursive: true }); // migracje (AUTO_MIGRATE=true)
// Plik startowy dla hostingu: wczytuje .env z katalogu aplikacji (hasła tylko na serwerze), potem serwer Next.js.
cpSync(path.join(OUT, "server.js"), path.join(OUT, "next-server.js"));
writeFileSync(path.join(OUT, "server.js"), `// Start aplikacji na hostingu (Passenger / „Setup Node.js App”). Generowane przez scripts/build-deploy.mts.
const fs = require("node:fs");
const path = require("node:path");
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\\r?\\n/)) {
    const m = line.match(/^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(.*)\\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\\1$/, "$2");
  }
}
require("./next-server.js");
`);

step("ffmpeg dla Linuksa → bin/ffmpeg (na serwerze FFMPEG_BIN=<katalog aplikacji>/bin/ffmpeg)");
// Usuwamy ffmpeg.exe (Windows, ~80 MB) ze wszystkich kopii pakietu ffmpeg-static.
const dropExe = (dir: string) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) dropExe(p);
    else if (e.name.startsWith("ffmpeg.exe")) rmSync(p);
  }
};
dropExe(OUT);
if (!existsSync(FFMPEG_CACHE)) {
  const res = await fetch(FFMPEG_URL);
  if (!res.ok) throw new Error(`Nie udało się pobrać ffmpeg: ${res.status}`);
  mkdirSync(path.dirname(FFMPEG_CACHE), { recursive: true });
  writeFileSync(FFMPEG_CACHE, gunzipSync(Buffer.from(await res.arrayBuffer())));
}
mkdirSync(path.join(OUT, "bin"), { recursive: true });
cpSync(path.join(ROOT, "scripts", "server", "zmien-haslo.cjs"), path.join(OUT, "bin", "zmien-haslo.js")); // narzędzia serwisowe
cpSync(FFMPEG_CACHE, path.join(OUT, "bin", "ffmpeg"));
chmodSync(path.join(OUT, "bin", "ffmpeg"), 0o755);

step("Archiwum");
execSync(`tar -czf m-art-sklep.tgz -C m-art-sklep .`, { cwd: path.join(ROOT, "deploy"), stdio: "inherit" });
console.log(`\n✔ Gotowe: deploy/m-art-sklep.tgz`);
