import "./_env.mts";
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";

// Uruchamia lokalną, przenośną MariaDB (bez instalacji) w tle. Katalog: MARIADB_HOME (domyślnie E:\m-art-sklep-db).
// Instalacja od zera — patrz SRODOWISKO.md.
const home = process.env.MARIADB_HOME || "E:\\m-art-sklep-db";
const port = Number(new URL(process.env.DATABASE_URL || "mysql://x@127.0.0.1:3307/x").port || 3306);

const isOpen = () => new Promise<boolean>((resolve) => {
  const s = net.connect({ host: "127.0.0.1", port }, () => { s.end(); resolve(true); }).on("error", () => resolve(false));
});

if (await isOpen()) { console.log(`✔ MariaDB już działa (port ${port}).`); process.exit(0); }
const dist = existsSync(home) ? readdirSync(home).find((d) => d.startsWith("mariadb-")) : undefined;
if (!dist) { console.error(`✖ Nie znaleziono MariaDB w ${home}. Instrukcja: SRODOWISKO.md → „Baza danych”.`); process.exit(1); }
const child = spawn(path.join(home, dist, "bin", "mysqld.exe"), [`--defaults-file=${path.join(home, "data", "my.ini")}`], { detached: true, stdio: "ignore", windowsHide: true });
child.unref();
for (let i = 0; i < 30; i++) {
  if (await isOpen()) { console.log(`✔ MariaDB uruchomiona (port ${port}).`); process.exit(0); }
  await new Promise((r) => setTimeout(r, 500));
}
console.error("✖ MariaDB nie wystartowała w 15 s. Sprawdź plik błędów w katalogu data.");
process.exit(1);
