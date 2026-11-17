import { getDb } from "@/db";
import { getStorefront } from "@/lib/store";
import { Shop } from "@/components/shop";

// Strona czyta bazę przy każdym żądaniu — `next build` nie dotyka bazy danych.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { categories, products } = await getStorefront(await getDb());
  return <Shop products={products} categories={categories.map((c) => c.name)} />;
}
