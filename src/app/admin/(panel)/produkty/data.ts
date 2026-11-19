import { asc } from "drizzle-orm";
import type { Db } from "@/db";
import { categories } from "@/db/schema";
import { getStoneNames } from "@/lib/stones";

export async function getProductFormOptions(db: Db) {
  const [categoryRows, stones] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.position), asc(categories.name)),
    getStoneNames(db), // słownik kamieni (panel „Kamienie”) — spójne nazwy = poprawne filtry i strony kamieni
  ]);
  return { categories: categoryRows, stones };
}
