import { asc, ne } from "drizzle-orm";
import type { Db } from "@/db";
import { categories, products } from "@/db/schema";

export async function getProductFormOptions(db: Db) {
  const [categoryRows, stoneRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.position), asc(categories.name)),
    db.selectDistinct({ stone: products.stone }).from(products).where(ne(products.stone, "")).orderBy(asc(products.stone)),
  ]);
  return { categories: categoryRows, stones: stoneRows.map((row) => row.stone) };
}
