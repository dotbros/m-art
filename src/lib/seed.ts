import { count } from "drizzle-orm";
import type { Db } from "@/db";
import { categories, products } from "@/db/schema";
import { seedCategories, seedProducts } from "./catalog";

/** Wgrywa dane demonstracyjne, ale tylko do pustej bazy (nie nadpisuje zmian z panelu). */
export async function seedDemoData(db: Db): Promise<boolean> {
  const [{ value }] = await db.select({ value: count() }).from(categories);
  if (value > 0) return false;
  const inserted = await db.insert(categories).values(seedCategories).returning({ id: categories.id, slug: categories.slug });
  const idBySlug = new Map(inserted.map((row) => [row.slug, row.id]));
  await db.insert(products).values(seedProducts.map(({ category, ...product }) => ({ ...product, categoryId: idBySlug.get(category)! })));
  return true;
}
