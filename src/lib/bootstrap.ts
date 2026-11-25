import { count } from "drizzle-orm";
import { getDbHandle } from "@/db";
import { adminUsers } from "@/db/schema";
import { runMigrations } from "@/db/migrate";
import { seedDemoData } from "./seed";
import { createAdminUser } from "./auth/sessions";
import { validatePasswordStrength } from "./auth/password";
import { isEmail } from "./validation";

export async function bootstrap() {
  const handle = await getDbHandle();
  // Domyślnie: lokalnie (dev) migracje same; produkcyjnie tylko przy AUTO_MIGRATE=true.
  const autoMigrate = process.env.AUTO_MIGRATE ? process.env.AUTO_MIGRATE === "true" : process.env.NODE_ENV !== "production";
  if (autoMigrate) await runMigrations(handle);
  if (process.env.SEED_DEMO_DATA === "true" && (await seedDemoData(handle.db))) console.log("[M.art] Wgrano dane demonstracyjne.");

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const [{ value }] = await handle.db.select({ value: count() }).from(adminUsers);
    if (value === 0) {
      if (!isEmail(email) || validatePasswordStrength(password)) console.warn("[M.art] ADMIN_EMAIL/ADMIN_PASSWORD są niepoprawne (hasło min. 10 znaków) — konto nie zostało utworzone.");
      else { await createAdminUser(handle.db, email, password, "Administrator"); console.log(`[M.art] Utworzono konto administratora: ${email}`); }
    }
  }
}
