import { and, asc, count, eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { heroSlides, products, stones } from "@/db/schema";

/** Warunek: lista kamieni produktu (JSON) zawiera dokładnie tę nazwę. */
export const hasStone = (name: string) => sql`JSON_CONTAINS(${products.stones}, ${JSON.stringify(name)})`;
import { slugify, type Product } from "./catalog";
import type { Result } from "./validation";

/** Kamień w postaci dla sklepu. */
export type Stone = { id: number; name: string; slug: string; caption: string; description: string; images: string[]; showOnHome: boolean };

export const MAX_STONE_IMAGES = 8;
const MEDIA_URL = /^\/(media\/[a-f0-9]{32}\.(jpg|png|webp)|images\/[a-z0-9-]+\.(svg|jpg|png|webp))$/;
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

const toStone = (r: typeof stones.$inferSelect): Stone => ({ id: r.id, name: r.name, slug: r.slug, caption: r.caption, description: r.description, images: r.images, showOnHome: r.showOnHome });

/** Kamienie do sekcji „Każdy kamień ma swoją historię” na stronie głównej. */
export async function getHomeStones(db: Db, limit = 12): Promise<Stone[]> {
  const rows = await db.select().from(stones).where(and(eq(stones.isActive, true), eq(stones.showOnHome, true))).orderBy(asc(stones.position), asc(stones.name)).limit(limit);
  return rows.map(toStone);
}

/** Wszystkie widoczne kamienie (strona /kamienie). */
export async function getActiveStones(db: Db): Promise<Stone[]> {
  const rows = await db.select().from(stones).where(eq(stones.isActive, true)).orderBy(asc(stones.position), asc(stones.name));
  return rows.map(toStone);
}

/** Strona kamienia: opis + widoczne produkty z tym kamieniem. */
export async function getStonePage(db: Db, slug: string): Promise<{ stone: Stone; products: Pick<Product, "id" | "name" | "subtitle" | "price" | "compareAtPrice" | "image" | "stock">[] } | null> {
  const [row] = await db.select().from(stones).where(and(eq(stones.slug, slug), eq(stones.isActive, true)));
  if (!row) return null;
  const list = await db.select({ id: products.id, name: products.name, subtitle: products.subtitle, price: products.price, compareAtPrice: products.compareAtPrice, image: products.image, stock: products.stock })
    .from(products).where(and(eq(products.isActive, true), hasStone(row.name))).orderBy(asc(products.position), asc(products.name));
  return { stone: toStone(row), products: list.map((p) => ({ ...p, image: p.image || "/images/necklace-jasper.svg" })) };
}

/** Nazwy wszystkich kamieni ze słownika — podpowiedzi w formularzu produktu. */
export async function getStoneNames(db: Db): Promise<string[]> {
  const rows = await db.select({ name: stones.name }).from(stones).orderBy(asc(stones.name));
  return rows.map((r) => r.name);
}

/**
 * Dopisuje do słownika kamienie, których jeszcze w nim nie ma (np. wpisane przy tworzeniu produktu).
 * Opis i zdjęcia uzupełnia się później w panelu „Kamienie”.
 */
export async function ensureStones(db: Db, names: string[]) {
  for (const name of names) {
    if (!name.trim()) continue;
    let slug = slugify(name) || "kamien";
    const [taken] = await db.select({ id: stones.id }).from(stones).where(eq(stones.slug, slug));
    if (taken) slug = `${slug}-${Date.now().toString(36)}`;
    // Kamień o tej nazwie już jest → nic nie zmieniamy.
    await db.insert(stones).values({ name, slug }).onDuplicateKeyUpdate({ set: { name: sql`${stones.name}` } });
  }
}

/** Zmiana nazwy kamienia: aktualizuje też listy kamieni w produktach i kamień w slajdach HERO. */
export async function renameStoneEverywhere(db: Db, oldName: string, newName: string) {
  if (oldName === newName) return;
  const affected = await db.select({ id: products.id, stones: products.stones }).from(products).where(hasStone(oldName));
  for (const p of affected) {
    await db.update(products).set({ stones: [...new Set(p.stones.map((s) => (s === oldName ? newName : s)))] }).where(eq(products.id, p.id));
  }
  await db.update(heroSlides).set({ stone: newName }).where(eq(heroSlides.stone, oldName));
}

export async function countProductsWithStone(db: Db, name: string) {
  const [row] = await db.select({ value: count() }).from(products).where(hasStone(name));
  return row?.value ?? 0;
}

// ---------- Walidacja formularza kamienia (panel) ----------
export type StoneInput = { name: string; slug: string; caption: string; description: string; images: string[]; showOnHome: boolean; position: number; isActive: boolean };

export function validateStone(form: FormData): Result<StoneInput> {
  const errors: Record<string, string> = {};
  const raw = str(form.get("name")).replace(/\s+/g, " ");
  const name = raw ? raw.charAt(0).toLocaleUpperCase("pl-PL") + raw.slice(1) : "";
  const slug = slugify(str(form.get("slug")) || name);
  const caption = str(form.get("caption"));
  const description = str(form.get("description")).replace(/\r\n/g, "\n");
  const images = form.getAll("images").map((v) => str(v)).filter(Boolean);
  const position = Number(str(form.get("position")) || 0);
  if (name.length < 2 || name.length > 60) errors.name = "Nazwa musi mieć od 2 do 60 znaków.";
  if (!slug) errors.slug = "Adres (slug) nie może być pusty.";
  if (caption.length > 80) errors.caption = "Podpis może mieć maksymalnie 80 znaków.";
  if (description.length > 5000) errors.description = "Opis może mieć maksymalnie 5000 znaków.";
  if (images.length > MAX_STONE_IMAGES) errors.images = `Maksymalnie ${MAX_STONE_IMAGES} zdjęć.`;
  else if (images.some((u) => !MEDIA_URL.test(u))) errors.images = "Nieprawidłowe zdjęcie.";
  if (!Number.isInteger(position) || position < 0 || position > 999) errors.position = "Kolejność to liczba 0–999.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, slug, caption, description, images: [...new Set(images)], showOnHome: form.get("showOnHome") === "on", position, isActive: form.get("isActive") === "on" } };
}

/** Dane demonstracyjne kamieni (dla pustej bazy) — te same treści co w migracji 0006. */
export const seedStones = [
  { name: "Jaspis cesarski", slug: "jaspis-cesarski", caption: "Ciepło ziemi", images: ["/images/necklace-jasper.svg"], showOnHome: true, position: 1,
    description: "Jaspis cesarski zachwyca ciepłymi odcieniami piasku, terakoty i miodu. Jego rysunek przypomina mapy dawnych lądów — nie ma dwóch takich samych kamieni.\n\nUznawany za kamień spokoju i uziemienia. W biżuterii M.art łączymy go ze złoconą stalą, by podkreślić jego naturalne ciepło." },
  { name: "Perła naturalna", slug: "perla-naturalna", caption: "Subtelność i blask", images: ["/images/earrings-pearl.svg"], showOnHome: true, position: 2,
    description: "Perły słodkowodne powstają powoli, warstwa po warstwie. Każda ma własny kształt i delikatny, opalizujący połysk.\n\nTo symbol kobiecości i czułości — ponadczasowy dodatek, który pasuje zarówno do codziennych stylizacji, jak i na wyjątkowe okazje." },
  { name: "Agat mszysty", slug: "agat-mszysty", caption: "Bliskość natury", images: ["/images/bracelet-agate.svg"], showOnHome: true, position: 3,
    description: "Agat mszysty skrywa w swoim wnętrzu zielone wzory przypominające mech, paprocie i leśne runo. Mały fragment lasu, który można nosić przy sobie.\n\nKojarzony z równowagą i nowym początkiem. Pięknie łączy się z naturalnymi tkaninami i ciepłym złotem." },
];
