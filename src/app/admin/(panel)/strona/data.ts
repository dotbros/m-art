import { asc } from "drizzle-orm";
import type { Db } from "@/db";
import { products } from "@/db/schema";

/** Kamienie i produkty do list wyboru w formularzu slajdu. */
export async function getHeroFormOptions(db: Db) {
  const rows = await db.select({ id: products.id, name: products.name, stones: products.stones }).from(products).orderBy(asc(products.name));
  return {
    stones: [...new Set(rows.flatMap((r) => r.stones))].sort((a, b) => a.localeCompare(b, "pl")),
    products: rows.map(({ id, name }) => ({ id, name })),
  };
}
