import { asc } from "drizzle-orm";
import type { Db } from "@/db";
import { categories, products } from "@/db/schema";

export async function getProductFormOptions(db: Db) {
  const [categoryRows, stoneRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.position), asc(categories.name)),
    db.select({ stones: products.stones }).from(products),
  ]);
  // Wszystkie kamienie użyte w produktach — podpowiedzi w formularzu (spójne nazwy = poprawne filtry w sklepie).
  const stones = [...new Set(stoneRows.flatMap((row) => row.stones))].sort((a, b) => a.localeCompare(b, "pl"));
  return { categories: categoryRows, stones };
}