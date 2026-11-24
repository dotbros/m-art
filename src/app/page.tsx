import { getDb } from "@/db";
import { getStorefront } from "@/lib/store";
import { FALLBACK_SLIDE, getActiveHeroSlides } from "@/lib/hero";
import { getHomeStones } from "@/lib/stones";
import { getPage } from "@/lib/pages";
import { Shop } from "@/components/shop";

// Strona czyta bazę przy każdym żądaniu — `next build` nie dotyka bazy danych.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await getDb();
  const [{ categories, products }, slides, homeStones, workshop] = await Promise.all([getStorefront(db), getActiveHeroSlides(db), getHomeStones(db), getPage(db, "pracownia")]);
  return <Shop products={products} categories={categories.map((c) => c.name)} slides={slides.length ? slides : [FALLBACK_SLIDE]}
    homeStones={homeStones.map(({ name, slug, caption, images }) => ({ name, slug, caption, images }))}
    story={workshop ? { image: workshop.teaserImage, title: workshop.teaserTitle || workshop.title, accent: workshop.teaserAccent, text: workshop.teaserText } : null} />;
}
