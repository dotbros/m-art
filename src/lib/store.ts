import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Category, Product } from "./catalog";

/** Aktywne kategorie i aktywne produkty do wyświetlenia w sklepie. Tylko odczyt. */
export async function getStorefront(db: Db): Promise<{ categories: Category[]; products: Product[] }> {
  const categoryRows = await db.select({ id: categories.id, slug: categories.slug, name: categories.name, description: categories.description, position: categories.position })
    .from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.position), asc(categories.name));

  const rows = await db.select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isActive, true), eq(categories.isActive, true)))
    .orderBy(asc(products.position), asc(products.name));

  return {
    categories: categoryRows,
    products: rows.map(({ product: p, categoryName, categorySlug }) => ({
      id: p.id, name: p.name, subtitle: p.subtitle, category: categoryName, categorySlug, stones: p.stones, material: p.material, size: p.size,
      price: p.price, compareAtPrice: p.compareAtPrice, image: p.images[0] || p.image || "/images/necklace-jasper.svg", images: p.images.length ? p.images : [p.image || "/images/necklace-jasper.svg"], badge: p.badge, description: p.description, stock: p.stock, position: p.position,
    })),
  };
}
