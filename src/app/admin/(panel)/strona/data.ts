import { asc } from "drizzle-orm";
import type { Db } from "@/db";
import { products } from "@/db/schema";
import { getStoneNames } from "@/lib/stones";

/** Kamienie i produkty do list wyboru w formularzu slajdu (produkty ze zdjęciem i ceną — do wyboru kolekcji). */
export async function getHeroFormOptions(db: Db) {
  const [rows, stones] = await Promise.all([
    db.select({ id: products.id, name: products.name, image: products.image, price: products.price, isActive: products.isActive }).from(products).orderBy(asc(products.position), asc(products.name)),
    getStoneNames(db),
  ]);
  return { stones, products: rows };
}
