import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import type { Db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { getDummyHash, hashPassword, verifyPassword } from "./password";

export const SESSION_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type AdminUser = { id: number; email: string; name: string };

export async function createAdminUser(db: Db, email: string, password: string, name = "") {
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(adminUsers).values({ email: email.trim().toLowerCase(), name, passwordHash })
    .onConflictDoUpdate({ target: adminUsers.email, set: { passwordHash, name } })
    .returning({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name });
  return user;
}

/** Sprawdza dane logowania. Zwraca użytkownika albo null (bez zdradzania, co było błędne). */
export async function authenticate(db: Db, email: string, password: string): Promise<AdminUser | null> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.trim().toLowerCase()));
  if (!user) { await verifyPassword(password, await getDummyHash()); return null; }
  return (await verifyPassword(password, user.passwordHash)) ? { id: user.id, email: user.email, name: user.name } : null;
}

/** Tworzy sesję i zwraca token do ciasteczka. W bazie trzymamy tylko jego skrót. */
export async function createSession(db: Db, userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
  await db.insert(adminSessions).values({ id: hashToken(token), userId, expiresAt });
  // Przy okazji sprzątamy wygasłe sesje.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  return { token, expiresAt };
}

export async function getSessionUser(db: Db, token: string | undefined): Promise<AdminUser | null> {
  if (!token || token.length > 100) return null;
  const id = hashToken(token);
  const [row] = await db.select({ user: { id: adminUsers.id, email: adminUsers.email, name: adminUsers.name }, expiresAt: adminSessions.expiresAt })
    .from(adminSessions).innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
    .where(and(eq(adminSessions.id, id), gt(adminSessions.expiresAt, new Date())));
  if (!row) return null;
  // Przedłużenie sesji najwyżej raz na dobę.
  if (row.expiresAt.getTime() - Date.now() < (SESSION_DAYS - 1) * DAY) {
    await db.update(adminSessions).set({ expiresAt: new Date(Date.now() + SESSION_DAYS * DAY) }).where(eq(adminSessions.id, id));
  }
  return row.user;
}

export async function deleteSession(db: Db, token: string | undefined) {
  if (token) await db.delete(adminSessions).where(eq(adminSessions.id, hashToken(token)));
}

// ---------- Limit prób logowania (w pamięci procesu; zeruje się po restarcie — patrz docs/DECYZJE.md) ----------
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5, WINDOW = 15 * 60 * 1000;

export function isRateLimited(key: string, now = Date.now()) {
  const entry = attempts.get(key);
  return !!entry && entry.count >= MAX_ATTEMPTS && entry.until > now;
}
export function registerFailedAttempt(key: string, now = Date.now()) {
  const entry = attempts.get(key);
  if (!entry || entry.until <= now) attempts.set(key, { count: 1, until: now + WINDOW });
  else entry.count += 1;
}
export function clearAttempts(key: string) {
  attempts.delete(key);
}
