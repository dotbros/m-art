import { getDb } from "@/db";
import { getStorefront } from "@/lib/store";
import { FALLBACK_SLIDE, getActiveHeroSlides } from "@/lib/hero";
import { getHomeStones } from "@/lib/stones";
import { Shop } from "@/components/shop";

// Strona czyta bazę przy każdym żądaniu — `next build` nie dotyka bazy danych.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await getDb();
  const [{ categories, products }, slides, homeStones] = await Promise.all([getStorefront(db), getActiveHeroSlides(db), getHomeStones(db)]);
  return <Shop products={products} categories={categories.map((c) => c.name)} slides={slides.length ? slides : [FALLBACK_SLIDE]}
    homeStones={homeStones.map(({ name, slug, caption, images }) => ({ name, slug, caption, images }))} />;
}
