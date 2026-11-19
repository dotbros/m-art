import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { heroSlides, products, stones } from "@/db/schema";
import { countProductsWithStone, ensureStones, getActiveStones, getHomeStones, getStoneNames, getStonePage, renameStoneEverywhere } from "@/lib/stones";
import { createTestDb } from "../helpers/db";

let handle: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => { handle = await createTestDb(); });
afterAll(async () => { await handle?.close(); });

describe("słownik kamieni", () => {
  it("dane startowe: 3 opisane kamienie na stronie głównej, wszystkie kamienie z produktów w słowniku", async () => {
    const home = await getHomeStones(handle.db);
    expect(home.map((s) => s.name)).toEqual(["Jaspis cesarski", "Perła naturalna", "Agat mszysty"]);
    expect(home[0]).toMatchObject({ slug: "jaspis-cesarski", caption: "Ciepło ziemi" });
    expect(home[0].description.length).toBeGreaterThan(50);
    expect(home[0].images).toEqual(["/images/necklace-jasper.svg"]);
    const productStones = (await handle.db.select({ s: products.stones }).from(products)).flatMap((r) => r.s);
    const names = await getStoneNames(handle.db);
    for (const s of productStones) expect(names).toContain(s);
  });

  it("strona kamienia: opis + tylko widoczne produkty z tym kamieniem", async () => {
    const page = await getStonePage(handle.db, "agat-mszysty");
    expect(page?.stone.name).toBe("Agat mszysty");
    expect(page?.products.map((p) => p.id)).toEqual(["bransoletka-agat"]);
    await handle.db.update(products).set({ isActive: false }).where(eq(products.id, "bransoletka-agat"));
    expect((await getStonePage(handle.db, "agat-mszysty"))?.products).toEqual([]);
    await handle.db.update(products).set({ isActive: true }).where(eq(products.id, "bransoletka-agat"));
    expect(await getStonePage(handle.db, "nie-ma-takiego")).toBeNull();
  });

  it("ukryty kamień nie ma strony i nie jest na liście", async () => {
    await handle.db.update(stones).set({ isActive: false }).where(eq(stones.slug, "agat-mszysty"));
    expect(await getStonePage(handle.db, "agat-mszysty")).toBeNull();
    expect((await getActiveStones(handle.db)).map((s) => s.slug)).not.toContain("agat-mszysty");
    await handle.db.update(stones).set({ isActive: true }).where(eq(stones.slug, "agat-mszysty"));
  });

  it("kamień wpisany przy produkcie trafia do słownika (bez duplikatów, unikalny adres)", async () => {
    await ensureStones(handle.db, ["Kwarc różowy", "Kwarc różowy", "Jaspis cesarski"]);
    const rows = await handle.db.select().from(stones).where(eq(stones.name, "Kwarc różowy"));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ slug: "kwarc-rozowy", showOnHome: false, isActive: true });
  });

  it("zmiana nazwy aktualizuje produkty i slajdy HERO", async () => {
    await handle.db.update(stones).set({ name: "Perła słodkowodna" }).where(eq(stones.name, "Perła naturalna"));
    await renameStoneEverywhere(handle.db, "Perła naturalna", "Perła słodkowodna");
    expect(await countProductsWithStone(handle.db, "Perła naturalna")).toBe(0);
    expect(await countProductsWithStone(handle.db, "Perła słodkowodna")).toBe(4);
    const [slide] = await handle.db.select().from(heroSlides).where(eq(heroSlides.title, "Małe perły,"));
    expect(slide.stone).toBe("Perła słodkowodna");
  });

  it("adresy kamieni z polskimi znakami (wzór z migracji 0006)", async () => {
    const result = await handle.db.execute(sql`select trim(both '-' from regexp_replace(lower(translate(${"Perełki ozdobne – Żółty Kwarc"}, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ')), '[^a-z0-9]+', '-', 'g')) as slug`);
    expect((result as unknown as { rows: { slug: string }[] }).rows[0].slug).toBe("perelki-ozdobne-zolty-kwarc");
  });
});
