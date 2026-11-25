#!/usr/bin/env node
// Zmiana hasła administratora NA SERWERZE (bez tsx i bez kodu źródłowego). Trafia do paczki jako bin/zmien-haslo.js.
// Użycie (w katalogu aplikacji, w środowisku Node z panelu):
//   node bin/zmien-haslo.js               — zapyta o e-mail i hasło (hasło nie jest wyświetlane)
// Format hasła taki sam jak w src/lib/auth/password.ts (scrypt). Wylogowuje wszystkie sesje tego konta.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const readline = require("node:readline");

const APP = path.join(__dirname, "..");
const envFile = path.join(APP, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
const mysql = require(path.join(APP, "node_modules", "mysql2", "promise"));

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, (answer) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(answer.trim()); });
  });
}

(async () => {
  const u = new URL(process.env.DATABASE_URL);
  const conn = await mysql.createConnection({
    ...(process.env.DATABASE_SOCKET ? { socketPath: process.env.DATABASE_SOCKET } : { host: u.hostname, port: Number(u.port || 3306) }),
    user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: decodeURIComponent(u.pathname.slice(1)),
  });
  const [admins] = await conn.query("SELECT id, email FROM admin_users ORDER BY id");
  console.log("Konta administratora:", admins.map((a) => a.email).join(", ") || "(brak)");
  const email = ((await ask(`E-mail [${admins[0] ? admins[0].email : ""}]: `)) || (admins[0] && admins[0].email) || "").toLowerCase();
  const password = await ask("Nowe hasło (min. 10 znaków, nie będzie widoczne): ", true);
  const repeat = await ask("Powtórz hasło: ", true);
  if (password.length < 10 || password.length > 200) { console.error("✖ Hasło musi mieć od 10 do 200 znaków."); process.exit(1); }
  if (password !== repeat) { console.error("✖ Hasła się różnią."); process.exit(1); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { console.error("✖ Niepoprawny e-mail."); process.exit(1); }

  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  const hash = `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;
  const existing = admins.find((a) => a.email === email);
  if (existing) {
    await conn.query("UPDATE admin_users SET password_hash = ? WHERE id = ?", [hash, existing.id]);
    await conn.query("DELETE FROM admin_sessions WHERE user_id = ?", [existing.id]);
    console.log(`✔ Zmieniono hasło: ${email} (wylogowano wszystkie sesje).`);
  } else {
    await conn.query("INSERT INTO admin_users (email, name, password_hash) VALUES (?, 'Administrator', ?)", [email, hash]);
    console.log(`✔ Utworzono konto administratora: ${email}`);
  }
  await conn.end();
})().catch((e) => { console.error("✖", e.message); process.exit(1); });
