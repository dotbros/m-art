import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { adminSessions } from "@/db/schema";
import { authenticate, createAdminUser, createSession, deleteSession, getSessionUser, hashToken } from "@/lib/auth/sessions";
import { createTestDb } from "../helpers/db";

let handle: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => { handle = await createTestDb({ seed: false }); await createAdminUser(handle.db, "Admin@Mart.pl", "SuperHaslo123", "Ania"); });
afterAll(async () => { await handle?.close(); });

describe("logowanie administratora", () => {
  it("akceptuje poprawne dane (e-mail bez względu na wielkość liter)", async () => {
    expect(await authenticate(handle.db, "admin@mart.PL", "SuperHaslo123")).toMatchObject({ email: "admin@mart.pl", name: "Ania" });
  });
  it("odrzuca złe hasło i nieistniejące konto", async () => {
    expect(await authenticate(handle.db, "admin@mart.pl", "zle-haslo-123")).toBeNull();
    expect(await authenticate(handle.db, "nikt@mart.pl", "SuperHaslo123")).toBeNull();
  });
  it("admin:create na istniejącym koncie zmienia hasło", async () => {
    await createAdminUser(handle.db, "admin@mart.pl", "NoweHaslo4567", "Ania");
    expect(await authenticate(handle.db, "admin@mart.pl", "SuperHaslo123")).toBeNull();
    expect(await authenticate(handle.db, "admin@mart.pl", "NoweHaslo4567")).not.toBeNull();
  });
});

describe("sesje", () => {
  it("w bazie zapisany jest tylko skrót tokena", async () => {
    const user = (await authenticate(handle.db, "admin@mart.pl", "NoweHaslo4567"))!;
    const { token } = await createSession(handle.db, user.id);
    const rows = await handle.db.select().from(adminSessions);
    expect(rows.some((r) => r.id === token)).toBe(false);
    expect(rows.some((r) => r.id === hashToken(token))).toBe(true);
    expect((await getSessionUser(handle.db, token))?.email).toBe("admin@mart.pl");
  });
  it("nie wpuszcza z fałszywym, wygasłym ani usuniętym tokenem", async () => {
    const user = (await authenticate(handle.db, "admin@mart.pl", "NoweHaslo4567"))!;
    expect(await getSessionUser(handle.db, "falszywy-token")).toBeNull();
    expect(await getSessionUser(handle.db, undefined)).toBeNull();
    const { token } = await createSession(handle.db, user.id);
    await handle.db.update(adminSessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(adminSessions.id, hashToken(token)));
    expect(await getSessionUser(handle.db, token)).toBeNull();
    const second = await createSession(handle.db, user.id);
    await deleteSession(handle.db, second.token);
    expect(await getSessionUser(handle.db, second.token)).toBeNull();
  });
});
