import "./_env.mts";
import { createInterface } from "node:readline/promises";
import { createDb } from "../src/db/index.ts";
import { createAdminUser } from "../src/lib/auth/sessions.ts";
import { validatePasswordStrength } from "../src/lib/auth/password.ts";
import { isEmail } from "../src/lib/validation.ts";

// Użycie: npm run admin:create -- email@domena.pl "BardzoMocneHaslo"
// (bez argumentów skrypt zapyta o dane). Istniejącemu kontu zmienia hasło.
let [email, password] = process.argv.slice(2);
if (!email || !password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  email ||= await rl.question("E-mail administratora: ");
  password ||= await rl.question("Hasło (min. 10 znaków): ");
  rl.close();
}
if (!isEmail(email.trim())) { console.error("✖ Niepoprawny e-mail."); process.exit(1); }
const weak = validatePasswordStrength(password);
if (weak) { console.error(`✖ ${weak}`); process.exit(1); }

const handle = await createDb();
try {
  const user = await createAdminUser(handle.db, email, password, "Administrator");
  console.log(`✔ Konto administratora gotowe: ${user.email}`);
} finally {
  await handle.close();
}
