import { count, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { categories, products, stones } from "@/db/schema";
import { seedCategories, seedProducts } from "./catalog";
import { ensureStones, seedStones } from "./stones";

/** Wgrywa dane demonstracyjne, ale tylko do pustej bazy (nie nadpisuje zmian z panelu). */
export async function seedDemoData(db: Db): Promise<boolean> {
  const [{ value }] = await db.select({ value: count() }).from(categories);
  if (value > 0) return false;
  await db.insert(categories).values(seedCategories);
  const inserted = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const idBySlug = new Map(inserted.map((row) => [row.slug, row.id]));
  await db.insert(products).values(seedProducts.map(({ category, ...product }) => ({ ...product, images: [product.image], categoryId: idBySlug.get(category)! })));
  // Słownik kamieni: opisane kamienie ze wzoru + pozostałe kamienie użyte w produktach
  await db.insert(stones).values(seedStones).onDuplicateKeyUpdate({ set: { name: sql`${stones.name}` } });
  await ensureStones(db, [...new Set(seedProducts.flatMap((p) => p.stones))]);
  return true;
}
